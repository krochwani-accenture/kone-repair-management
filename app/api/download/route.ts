import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'backend', 'kone_repair_catalog_2500.xlsx');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found. Run backend/create_large_sample.js first.' }, { status: 404 });
  }

  const fileBuffer = await fs.promises.readFile(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="kone_repair_catalog_2500.xlsx"',
    },
  });
}
