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
                using var window = new CatalogWindow();
                window.CreateControl();
                var rows = CatalogClient.SearchAsync("@Peteroxhka", "all", "", "popular", 0, CancellationToken.None)
                    .GetAwaiter().GetResult();
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
    private static readonly string Site = "https://peteroxhka.github.io/repo-radar/";
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

    public CatalogWindow()
    {
        Text = "Repo Radar";
        ClientSize = new(1200, 820);
        MinimumSize = new(820, 560);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10);
        AutoScaleMode = AutoScaleMode.Dpi;
        page.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        scroll.Controls.Add(page);
        var shell = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1, Margin = Padding.Empty };
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 206));
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        sidebar.Dock = DockStyle.Fill;
        sidebar.Margin = Padding.Empty;
        sidebar.AutoScroll = true;
        sidebar.Padding = new(16, 18, 12, 12);
        shell.Controls.Add(sidebar, 0, 0);
        shell.Controls.Add(scroll, 1, 0);
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
        sidebar.Controls.Add(MakeLabel("Repo Radar", 18, true));
        sidebar.Controls.Add(MakeLabel("Категории", 10, tone: "muted"));
        chips.Dock = DockStyle.None;
        chips.FlowDirection = FlowDirection.TopDown;
        chips.WrapContents = false;
        sidebar.Controls.Add(chips);
        for (var i = 0; i < Names.Length; i++)
        {
            var index = i;
            var chip = MakeButton(i == 0 ? "Все проекты" : Names[i]);
            chip.AutoSize = false;
            chip.Size = new(155, 33);
            chip.TextAlign = ContentAlignment.MiddleLeft;
            chip.Margin = new(0, 0, 0, 3);
            chip.Click += async (_, _) =>
            {
                selectedCategory = index;
                sectionTitle.Text = index == 0 ? "Все проекты" : Names[index];
                PaintTheme(this);
                await LoadPage(true);
            };
            chips.Controls.Add(chip);
        }
        sidebar.Controls.Add(MakeLabel("Оформление", 10, tone: "muted"));
        theme.Width = 155;
        sidebar.Controls.Add(theme);
        sidebar.Controls.Add(MakeButton("Console Hub ↗", () => Open("https://peteroxhka.github.io/ConsoleWebKit/")));
        sidebar.Controls.Add(MakeButton("Аккаунт и чат ↗", () => Open(Site)));

        var hero = Section();
        hero.Tag = "hero";
        hero.Padding = new(22, 24, 22, 14);
        hero.Controls.Add(MakeLabel("Что ищем сегодня?", 29, true));
        hero.Controls.Add(total);
        var searchBar = Flow();
        searchBar.Dock = DockStyle.None;
        searchBar.WrapContents = false;
        searchBar.Padding = new(8, 7, 5, 5);
        searchBar.Tag = "surface";
        query.Width = 330;
        query.BorderStyle = BorderStyle.None;
        query.Font = new Font("Segoe UI", 12);
        query.Margin = new(5, 10, 8, 5);
        searchBar.Controls.AddRange([query, find]);
        hero.Controls.Add(searchBar);
        page.Controls.Add(hero);

        page.Controls.Add(sectionTitle);
        var filters = Flow();
        filters.Controls.AddRange([language, sort, descriptions]);
        page.Controls.Add(filters);
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
        Shown += async (_, _) => await LoadPage(true);
        FormClosed += (_, _) => { request?.Cancel(); Microsoft.Win32.SystemEvents.UserPreferenceChanged -= SystemThemeChanged; };
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
        var button = new Button { Text = title, AutoSize = true, FlatStyle = FlatStyle.Flat,
            Padding = new(10,4,10,4), Tag = primary ? "primary" : "" };
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
            _ => "#0a101e #111a2a #172238 #f1f5fc #96a5bf #82f0b5 #08291b"
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
            Equals(control.Tag, "surface") ? surface :
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

    private int ColumnCount() => scroll.ClientSize.Width >= 760 ? 2 : 1;

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
