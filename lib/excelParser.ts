import * as XLSX from 'xlsx';

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const parseExcelSheets = (fileBuffer: ArrayBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const availableSheets = workbook.SheetNames;
    const sheets: Record<
        string,
        { data: any[]; rowCount: number; columns: string[] }
    > = {};
    let totalRowCount = 0;

    availableSheets.forEach((name) => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: '',
        });
        const columns = data.length > 0 ? Object.keys(data[0] ?? {}) : [];
        sheets[name] = {
            data,
            rowCount: data.length,
            columns,
        };
        totalRowCount += data.length;
    });

    return {
        success: true,
        sheets,
        totalRowCount,
        availableSheets,
    };
};

export const collectAllRows = (uploadedData: any): any[] => {
    if (!uploadedData) return [];
    if (Array.isArray(uploadedData.data)) return uploadedData.data;
    if (uploadedData.sheets && uploadedData.availableSheets) {
        return uploadedData.availableSheets.flatMap(
            (name: string) => uploadedData.sheets[name]?.data ?? []
        );
    }
    return [];
};

export const collectAllColumns = (rows: any[]): string[] => {
    if (rows.length === 0) return [];
    return Array.from(
        rows.reduce((keys: Set<string>, row: any) => {
            Object.keys(row).forEach((key) => keys.add(key));
            return keys;
        }, new Set<string>())
    ) as string[];
};