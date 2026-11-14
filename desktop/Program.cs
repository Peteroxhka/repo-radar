using System.Diagnostics;
using System.Drawing;

namespace RepoRadar;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Contains("--smoke-test"))
        {
            try
            {
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
        ApplicationConfiguration.Initialize();
        Application.Run(new CatalogWindow());
        return 0;
    }
}

internal sealed class CatalogWindow : Form
{
    private static readonly string[] Categories =
        ["all", "ai", "tools", "programming", "web", "data", "games", "learning", "console_webkit", "other"];
    private static readonly string[] Sorts = ["popular", "recent", "newest", "least", "forked"];

    private readonly TextBox query = new() { MaxLength = 80, PlaceholderText = "Название, @владелец или owner/repo" };
    private readonly TextBox language = new() { MaxLength = 40, PlaceholderText = "Язык, например Python" };
    private readonly ComboBox category = new() { DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly ComboBox sort = new() { DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly Button search = new() { Text = "Найти", AutoSize = true };
    private readonly Button more = new() { Text = "Загрузить ещё", AutoSize = true, Enabled = false };
    private readonly Button open = new() { Text = "Открыть на GitHub", AutoSize = true, Enabled = false };
    private readonly Label status = new() { Text = "Подключение к каталогу…", AutoSize = true, Margin = new(10, 10, 0, 0) };
    private readonly ListView list = new()
    {
        Dock = DockStyle.Fill, View = View.Details, FullRowSelect = true,
        MultiSelect = false, HideSelection = false
    };
    private CancellationTokenSource? request;
    private int offset;
    private (string Query, string Category, string Language, string Sort) active;

    public CatalogWindow()
    {
        Text = "Repo Radar · Каталог GitHub";
        ClientSize = new Size(1020, 650);
        MinimumSize = new Size(650, 360);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10);
        BackColor = Color.FromArgb(239, 244, 250);
        category.Items.AddRange(["Все категории", "ИИ", "Инструменты", "Код", "Веб", "Данные", "Игры", "Обучение", "Консоли", "Другое"]);
        sort.Items.AddRange(["Популярные", "Недавно обновлённые", "Новые", "Меньше звёзд", "Больше форков"]);
        category.SelectedIndex = sort.SelectedIndex = 0;
        query.Width = 270; language.Width = 160; category.Width = 155; sort.Width = 165;

        var heading = new Label
        {
            Text = "Repo Radar", AutoSize = true, Font = new Font("Segoe UI", 23, FontStyle.Bold),
            ForeColor = Color.FromArgb(20, 41, 73), Margin = new(0, 0, 0, 8)
        };
        var filters = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true };
        filters.Controls.AddRange([query, category, language, sort, search]);
        var footer = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true };
        footer.Controls.AddRange([more, open, status]);
        list.Columns.Add("Репозиторий", 240);
        list.Columns.Add("Язык", 100);
        list.Columns.Add("Звёзды", 85);
        list.Columns.Add("Описание", 545);

        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 4, Padding = new(16) };
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.Controls.Add(heading, 0, 0);
        layout.Controls.Add(filters, 0, 1);
        layout.Controls.Add(list, 0, 2);
        layout.Controls.Add(footer, 0, 3);
        Controls.Add(layout);

        AcceptButton = search;
        Shown += async (_, _) => await LoadPageAsync(true);
        search.Click += async (_, _) => await LoadPageAsync(true);
        more.Click += async (_, _) => await LoadPageAsync(false);
        open.Click += (_, _) => OpenSelected();
        list.DoubleClick += (_, _) => OpenSelected();
        list.SelectedIndexChanged += (_, _) => open.Enabled = list.SelectedItems.Count == 1;
        FormClosed += (_, _) => request?.Cancel();
    }

    private async Task LoadPageAsync(bool reset)
    {
        request?.Cancel();
        using var current = new CancellationTokenSource();
        request = current;
        if (reset)
        {
            active = (query.Text, Categories[category.SelectedIndex], language.Text.Trim(), Sorts[sort.SelectedIndex]);
            offset = 0;
            list.Items.Clear();
        }
        more.Enabled = false;
        status.Text = "Загрузка…";
        try
        {
            var page = await CatalogClient.SearchAsync(active.Query, active.Category, active.Language,
                active.Sort, offset, current.Token);
            if (current.IsCancellationRequested) return;

            list.BeginUpdate();
            try
            {
                foreach (var repo in page)
                {
                    var item = new ListViewItem([repo.FullName, repo.Language ?? "—", repo.Stars.ToString("N0"),
                        repo.Description ?? "—"]) { Tag = repo };
                    list.Items.Add(item);
                }
            }
            finally { list.EndUpdate(); }

            offset += page.Length;
            more.Enabled = page.Length == CatalogClient.PageSize && offset < page[0].Total;
            status.Text = page.Length > 0
                ? $"{offset:N0} из {page[0].Total:N0}"
                : offset == 0 ? "Ничего не найдено" : "Все результаты загружены";
        }
        catch (Exception error) when (error is HttpRequestException or OperationCanceledException or
            System.Text.Json.JsonException or InvalidDataException)
        {
            if (current.IsCancellationRequested) return;
            status.Text = "Не удалось загрузить каталог. Повтори запрос.";
            more.Enabled = !reset;
        }
        finally
        {
            if (ReferenceEquals(request, current)) request = null;
        }
    }

    private void OpenSelected()
    {
        if (list.SelectedItems.Count != 1 || list.SelectedItems[0].Tag is not Repository repo ||
            !Uri.TryCreate(repo.Url, UriKind.Absolute, out var url) ||
            url.Scheme != Uri.UriSchemeHttps || url.Host != "github.com") return;
        try { Process.Start(new ProcessStartInfo(url.AbsoluteUri) { UseShellExecute = true }); }
        catch (System.ComponentModel.Win32Exception) { status.Text = "Не удалось открыть GitHub."; }
    }
}
