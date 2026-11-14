using System.Diagnostics;
using System.Drawing;

namespace RepoRadar;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        if (args.Contains("--smoke-test"))
        {
            try
            {
                var rows = CatalogClient.SearchAsync("@Peteroxhka", "all", "", "popular", 0, CancellationToken.None)
                    .GetAwaiter().GetResult();
                using var window = new CatalogWindow(loadOnShow: false);
                window.VerifyLayout(rows);
                return rows.Any(row => row.FullName.Equals("Peteroxhka/repo-radar", StringComparison.OrdinalIgnoreCase)) ? 0 : 2;
            }
            catch (Exception error)
            {
                File.WriteAllText(Path.Combine(Path.GetTempPath(), "RepoRadar-smoke-error.txt"), error.ToString());
                return 1;
            }
        }
        Application.Run(new CatalogWindow());
        return 0;
    }
}

internal sealed class CatalogWindow : Form
{
    private static readonly string[] Categories = ["all","ai","tools","programming","web","data","games","learning","console_webkit","other"];
    private static readonly string[] Names = ["Все","ИИ","Инструменты","Код","Веб","Данные","Игры","Обучение","Консоли","Другое"];
    private static readonly string[] Sorts = ["popular","least","recent","newest","forked"];
    private static readonly string Website = "https://peteroxhka.github.io/repo-radar/";
    private readonly Panel scroll = new() { Dock = DockStyle.Fill, AutoScroll = true };
    private readonly TableLayoutPanel page = new() { Dock = DockStyle.Top, AutoSize = true, ColumnCount = 1, Padding = new(24,16,24,24) };
    private readonly TableLayoutPanel grid = new() { Dock = DockStyle.Top, AutoSize = true };
    private readonly FlowLayoutPanel chips = Flow();
    private readonly TextBox query = new() { Width = 250, MaxLength = 80, PlaceholderText = "Название, @ник или owner/repo" };
    private readonly TextBox language = new() { Width = 155, MaxLength = 40, PlaceholderText = "Язык, например Python" };
    private readonly ComboBox sort = new() { Width = 165, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly ComboBox theme = new() { Width = 105, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly CheckBox descriptions = new() { Text = "В описаниях", AutoSize = true };
    private readonly Label total = MakeLabel("— проектов", 11);
    private readonly Label status = MakeLabel("Загрузка…", 10);
    private readonly Button more = MakeButton("Показать ещё");
    private readonly List<Repository> repositories = [];
    private readonly string preferences = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RepoRadar", "theme.txt");
    private readonly FlowLayoutPanel sidebar = Section();
    private readonly Label sectionTitle = MakeLabel("Все проекты", 19, true);
    private CancellationTokenSource? request;
    private int selectedCategory, columns;
    private long matchCount;
    private (string Query, string Category, string Language, string Sort, bool Description) active;
    private Color background, surface, raised, foreground, muted, accent, accentText;

    public CatalogWindow(bool loadOnShow = true)
    {
        Text = "Repo Radar";
        ClientSize = new(1280, 820);
        MinimumSize = new(900, 560);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10);
        AutoScaleMode = AutoScaleMode.Dpi;
        page.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        scroll.Controls.Add(page);
        var shell = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 3, RowCount = 1, Margin = Padding.Empty };
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 74));
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 284));
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        sidebar.Dock = DockStyle.Fill;
        sidebar.Margin = Padding.Empty;
        sidebar.AutoScroll = true;
        sidebar.Padding = new(16, 18, 12, 12);
        var rail = new Panel { Dock = DockStyle.Fill, Margin = Padding.Empty, Tag = "rail" };
        var brand = MakeButton("R.", () => query.Focus(), true);
        brand.Dock = DockStyle.Top;
        brand.Height = 62;
        brand.Font = new Font("Segoe UI", 17, FontStyle.Bold);
        var settings = MakeButton("⚙", () => theme.Focus());
        settings.AccessibleName = "Выбор темы";
        settings.Dock = DockStyle.Bottom;
        settings.Height = 52;
        rail.Controls.Add(brand);
        rail.Controls.Add(settings);
        var workspace = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2, Margin = Padding.Empty };
        workspace.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        workspace.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        workspace.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        workspace.Controls.Add(scroll, 0, 1);
        shell.Controls.Add(rail, 0, 0);
        shell.Controls.Add(sidebar, 1, 0);
        shell.Controls.Add(workspace, 2, 0);
        Controls.Add(shell);

        theme.Items.AddRange(["Авто", "Тёмная", "Светлая", "Космос"]);
        theme.SelectedIndex = ReadTheme();
        theme.AccessibleName = "Тема";
        query.AccessibleName = "Поиск проектов";
        language.AccessibleName = "Язык программирования";
        sort.AccessibleName = "Сортировка";
        sort.Items.AddRange(["Популярные","Меньше звёзд","Недавно обновлённые","Новые","Больше форков"]);
        sort.SelectedIndex = 0;
        var find = MakeButton("Найти", primary: true);
        sidebar.Controls.Add(MakeLabel("Категории", 20, true));
        var categorySearch = new TextBox { Width = 224, PlaceholderText = "Найти категорию", AccessibleName = "Найти категорию" };
        sidebar.Controls.Add(categorySearch);
        chips.Dock = DockStyle.None;
        chips.FlowDirection = FlowDirection.TopDown;
        chips.WrapContents = false;
        sidebar.Controls.Add(chips);
        string[] marks = ["◈", "✦", "⌘", "‹›", "◎", "▤", "◇", "▧", "▣", "···"];
        for (var i = 0; i < Names.Length; i++)
        {
            var index = i;
            var name = i == 0 ? "Все проекты" : Names[i];
            var chip = MakeButton(name);
            chip.AccessibleName = name;
            chip.AutoSize = false;
            chip.Size = new(224, 42);
            chip.TextAlign = ContentAlignment.MiddleLeft;
            chip.Margin = new(0, 0, 0, 3);
            if (chip is RadarButton categoryButton) categoryButton.Mark = marks[i];
            chip.Click += async (_, _) =>
            {
                selectedCategory = index;
                sectionTitle.Text = name;
                PaintTheme(this);
                scroll.AutoScrollPosition = Point.Empty;
                await LoadPage(true);
            };
            chips.Controls.Add(chip);
        }
        categorySearch.TextChanged += (_, _) =>
        {
            foreach (Control chip in chips.Controls)
                chip.Visible = chip.Text.Contains(categorySearch.Text.Trim(), StringComparison.CurrentCultureIgnoreCase);
        };
        sidebar.Controls.Add(MakeLabel("Оформление", 10, tone: "muted"));
        theme.Width = 224;
        sidebar.Controls.Add(theme);
        sidebar.Controls.Add(MakeButton("Console Hub ↗", () => Open("https://peteroxhka.github.io/ConsoleWebKit/")));
        sidebar.Controls.Add(MakeButton("Аккаунт и чат ↗", () => Open(Website)));

        var toolbar = Section();
        toolbar.Margin = Padding.Empty;
        toolbar.Controls.Add(sectionTitle);
        var searchRow = Flow();
        searchRow.Dock = DockStyle.None;
        searchRow.WrapContents = false;
        query.Width = 345;
        query.Font = new Font("Segoe UI", 11);
        query.Margin = new(3, 7, 8, 4);
        searchRow.Controls.AddRange([query, find]);
        toolbar.Controls.Add(searchRow);
        var filters = Flow();
        filters.Dock = DockStyle.None;
        filters.WrapContents = false;
        filters.Controls.AddRange([language, sort, descriptions]);
        toolbar.Controls.Add(filters);
        workspace.Controls.Add(toolbar, 0, 0);
        page.Controls.Add(total);
        page.Controls.Add(status);
        page.Controls.Add(grid);
        page.Controls.Add(more);
        page.Controls.Add(MakeLabel("Repo Radar · Независимый каталог открытого кода", 10, tone: "muted"));
        more.Enabled = false;
        AcceptButton = find;
        find.Click += async (_, _) => await LoadPage(true);
        more.Click += async (_, _) => await LoadPage(false);
        theme.SelectedIndexChanged += (_, _) => { SaveTheme(); ApplyTheme(); };
        scroll.Resize += (_, _) => { if (ColumnCount() != columns) RebuildCards(); };
        if (loadOnShow) Shown += async (_, _) => await LoadPage(true);
        FormClosed += (_, _) => request?.Cancel();
        Disposed += (_, _) => Microsoft.Win32.SystemEvents.UserPreferenceChanged -= SystemThemeChanged;
        Microsoft.Win32.SystemEvents.UserPreferenceChanged += SystemThemeChanged;
        ApplyTheme();
    }

    private static Label MakeLabel(string text, float size, bool bold = false, string tone = "") => new()
    {
        Text = text, AutoSize = true, Font = new Font("Segoe UI", size, bold ? FontStyle.Bold : FontStyle.Regular),
        Tag = tone, Margin = new(3,5,8,8)
    };
    private static FlowLayoutPanel Flow() => new() { Dock = DockStyle.Top, AutoSize = true };
    private static FlowLayoutPanel Section() => new()
    {
        Dock = DockStyle.Top, AutoSize = true, FlowDirection = FlowDirection.TopDown,
        WrapContents = false, Padding = new(20), Margin = new(0,0,0,14), Tag = "surface"
    };
    private static Button MakeButton(string title, Action? action = null, bool primary = false)
    {
        var button = new RadarButton { Text = title, AutoSize = true, FlatStyle = FlatStyle.Flat,
            Padding = new(12,2,12,2), Tag = primary ? "primary" : "" };
        if (action is not null) button.Click += (_, _) => action();
        return button;
    }

    private int ReadTheme()
    {
        try { return int.TryParse(File.ReadAllText(preferences), out int value) && value is >= 0 and <= 3 ? value : 0; }
        catch (IOException) { return 0; }
        catch (UnauthorizedAccessException) { return 0; }
    }
    private void SaveTheme()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(preferences)!);
            File.WriteAllText(preferences, theme.SelectedIndex.ToString());
        }
        catch (IOException) {}
        catch (UnauthorizedAccessException) {}
    }

    private void SystemThemeChanged(object sender, Microsoft.Win32.UserPreferenceChangedEventArgs e)
    {
        if (!IsDisposed && IsHandleCreated)
            BeginInvoke((Action)(() => { if (theme.SelectedIndex == 0) ApplyTheme(); }));
    }

    private void ApplyTheme()
    {
        var systemLight = Equals(Microsoft.Win32.Registry.GetValue(
            @"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
            "AppsUseLightTheme", 0), 1);
        var colors = theme.SelectedIndex switch
        {
            2 => "#f6f8fd #ffffff #eaf0f9 #18233a #58697e #187f60 #ffffff",
            3 => "#100b26 #1e173b #29204d #f6edff #bdadd6 #ff9deb #321038",
            0 when systemLight => "#f6f8fd #ffffff #eaf0f9 #18233a #58697e #187f60 #ffffff",
            _ => "#151719 #1c1e21 #282b30 #f2f3f5 #a7adb5 #67b7ff #102b42"
        };
        var p = colors.Split(' ').Select(ColorTranslator.FromHtml).ToArray();
        (background, surface, raised, foreground, muted, accent, accentText) = (p[0],p[1],p[2],p[3],p[4],p[5],p[6]);
        PaintTheme(this);
    }

    private void PaintTheme(Control control)
    {
        var primary = Equals(control.Tag, "primary") ||
            (control.Parent == chips && chips.Controls.IndexOf(control) == selectedCategory);
        control.ForeColor = primary ? accentText : Equals(control.Tag, "muted") ? muted :
            Equals(control.Tag, "accent") ? accent : foreground;
        control.BackColor = control is Label or CheckBox or FlowLayoutPanel { Tag: null } ? Color.Transparent : primary ? accent :
            Equals(control.Tag, "rail") ? raised : Equals(control.Tag, "surface") ? surface :
            control is Button or ComboBox or TextBox ? raised : background;
        if (control is Button button)
        {
            button.FlatAppearance.BorderSize = 0;
            button.FlatAppearance.MouseOverBackColor = primary ? ControlPaint.Light(accent) : ControlPaint.Light(raised);
            button.FlatAppearance.MouseDownBackColor = primary ? ControlPaint.Dark(accent) : ControlPaint.Dark(raised);
            button.Cursor = Cursors.Hand;
        }
        foreach (Control child in control.Controls) PaintTheme(child);
    }

    internal void VerifyLayout(Repository[] rows)
    {
        Show();
        ApplyTheme();
        repositories.AddRange(rows);
        RebuildCards();
        PerformLayout();
        using var preview = new Bitmap(Width, Height);
        DrawToBitmap(preview, new Rectangle(0, 0, Width, Height));
        preview.Save(Path.Combine(Path.GetTempPath(), "RepoRadar-preview.png"));
        if (grid.Controls.Count != rows.Length || grid.Controls.Count == 0 ||
            chips.Controls.Cast<Control>().Any(chip => chip.Height < TextRenderer.MeasureText(chip.Text, chip.Font).Height + 4))
            throw new InvalidOperationException("Catalog cards or category layout did not render.");
        Hide();
    }

    private int ColumnCount() => scroll.ClientSize.Width >= 820 ? 2 : 1;

    private void RebuildCards()
    {
        columns = ColumnCount();
        grid.SuspendLayout();
        try
        {
            while (grid.Controls.Count > 0) grid.Controls[0].Dispose();
            grid.RowStyles.Clear();
            grid.ColumnStyles.Clear();
            grid.ColumnCount = columns;
            grid.RowCount = (repositories.Count + columns - 1) / columns;
            for (var col = 0; col < columns; col++) grid.ColumnStyles.Add(new(SizeType.Percent, 100f / columns));
            var width = Math.Max(210, (scroll.ClientSize.Width - 82) / columns - 40);
            for (var i = 0; i < repositories.Count; i++)
            {
                var row = repositories[i];
                var card = Section();
                card.Padding = new(16, 12, 12, 12);
                card.Margin = new(0,0,12,12);
                card.Controls.Add(MakeLabel($"{row.Language ?? "GitHub"}  ·  ★ {row.Stars:N0}", 10, true, "accent"));
                var title = MakeLabel(row.FullName, 13, true);
                title.MaximumSize = new(width,0);
                card.Controls.Add(title);
                var description = MakeLabel(row.Description ?? "Описание отсутствует", 10, tone: "muted");
                description.AutoSize = false;
                description.AutoEllipsis = true;
                description.Size = new(width,62);
                card.Controls.Add(description);
                var actions = new FlowLayoutPanel { AutoSize = true, WrapContents = false };
                actions.Controls.Add(MakeButton("Подробнее", () => ShowRepository(row)));
                actions.Controls.Add(MakeButton("GitHub ↗", () => OpenRepository(row.Url)));
                card.Controls.Add(actions);
                grid.Controls.Add(card, i % columns, i / columns);
                PaintTheme(card);
            }
        }
        finally { grid.ResumeLayout(); }
    }

    private async Task LoadPage(bool reset)
    {
        request?.Cancel();
        using var current = new CancellationTokenSource();
        request = current;
        if (reset)
        {
            active = (query.Text, Categories[selectedCategory], language.Text.Trim(), Sorts[sort.SelectedIndex], descriptions.Checked);
            repositories.Clear();
            RebuildCards();
        }
        more.Enabled = false;
        status.Text = "Загрузка…";
        try
        {
            var result = await CatalogClient.SearchAsync(active.Query, active.Category, active.Language, active.Sort,
                repositories.Count, current.Token, active.Description);
            if (current.IsCancellationRequested) return;
            if (result.Length > 0) matchCount = result[0].Total;
            else if (reset) matchCount = 0;
            repositories.AddRange(result);
            if (active.Query.Length == 0 && active.Category == "all" && active.Language.Length == 0)
                total.Text = $"{matchCount:N0} проектов";
            RebuildCards();
            more.Enabled = result.Length == CatalogClient.PageSize && repositories.Count < matchCount;
            status.Text = repositories.Count == 0 ? "Ничего не найдено" : $"{repositories.Count:N0} из {matchCount:N0}";
        }
        catch (Exception error) when (error is HttpRequestException or OperationCanceledException or
            System.Text.Json.JsonException or InvalidDataException)
        {
            if (current.IsCancellationRequested) return;
            status.Text = "Не удалось загрузить каталог. Повтори запрос.";
            more.Enabled = !reset;
        }
        finally { if (ReferenceEquals(request, current)) request = null; }
    }

    private void ShowRepository(Repository row)
    {
        using var details = new Form
        {
            Text = row.FullName, StartPosition = FormStartPosition.CenterParent,
            ClientSize = new(600, 350), MinimizeBox = false, MaximizeBox = false
        };
        var copy = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true,
            ScrollBars = ScrollBars.Vertical, Text = row.Description ?? "Описание отсутствует" };
        var actions = Flow();
        actions.Controls.Add(MakeButton("Открыть на GitHub ↗", () => OpenRepository(row.Url), true));
        details.Controls.Add(copy);
        details.Controls.Add(actions);
        PaintTheme(details);
        details.ShowDialog(this);
    }

    private void OpenRepository(string value)
    {
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == "https" &&
            uri.Host == "github.com" && uri.UserInfo.Length == 0) Open(uri.AbsoluteUri);
    }
    private void Open(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (System.ComponentModel.Win32Exception) { status.Text = "Не удалось открыть ссылку."; }
    }
}

internal sealed class RadarButton : Button
{
    internal string? Mark;
    private bool hovered;
    protected override void OnMouseEnter(EventArgs e) { base.OnMouseEnter(e); hovered = true; Invalidate(); }
    protected override void OnMouseLeave(EventArgs e) { base.OnMouseLeave(e); hovered = false; Invalidate(); }
    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.Clear(Parent is { BackColor.A: > 0 } parent ? parent.BackColor : FindForm()?.BackColor ?? BackColor);
        e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        var bounds = new Rectangle(1, 1, Width - 2, Height - 2);
        if (bounds.Width < 4 || bounds.Height < 4) return;
        var diameter = Math.Min(16, Math.Min(bounds.Width, bounds.Height));
        using var path = new System.Drawing.Drawing2D.GraphicsPath();
        path.AddArc(bounds.Left, bounds.Top, diameter, diameter, 180, 90);
        path.AddArc(bounds.Right - diameter, bounds.Top, diameter, diameter, 270, 90);
        path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
        path.AddArc(bounds.Left, bounds.Bottom - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
        using var brush = new SolidBrush(hovered && Enabled ? FlatAppearance.MouseOverBackColor : BackColor);
        e.Graphics.FillPath(brush, path);
        var textBounds = Rectangle.Inflate(bounds, -10, 0);
        var flags = TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine |
            TextFormatFlags.EndEllipsis | TextFormatFlags.NoPrefix;
        if (Mark is not null)
        {
            TextRenderer.DrawText(e.Graphics, Mark, Font, new Rectangle(textBounds.X, textBounds.Y, 30, textBounds.Height),
                ForeColor, flags | TextFormatFlags.HorizontalCenter);
            textBounds.X += 34;
            textBounds.Width -= 34;
        }
        else flags |= TextFormatFlags.HorizontalCenter;
        TextRenderer.DrawText(e.Graphics, Text, Font, textBounds, Enabled ? ForeColor : SystemColors.GrayText, flags);
        if (Focused && ShowFocusCues) ControlPaint.DrawFocusRectangle(e.Graphics, Rectangle.Inflate(bounds, -4, -4));
    }
}
