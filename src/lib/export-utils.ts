/**
 * Church OS: Data Export Infrastructure
 * Utility to convert Supabase query results to CSV and trigger download.
 */

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [
        headers.join(','), // header row
        ...data.map(row =>
            headers.map(fieldName => {
                const value = row[fieldName];
                const escaped = ('' + value).replace(/"/g, '""'); // escape double quotes
                return `"${escaped}"`;
            }).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
