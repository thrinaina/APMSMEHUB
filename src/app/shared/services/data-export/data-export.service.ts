import { Injectable } from '@angular/core';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class DataExportService {

  constructor() { }

  async exportToExcel(fileName: string, tableId: any, sheetName: string) {
    /* table id is passed over here */
    let element = document.getElementById(tableId);
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

    ws['!cols'] = [];
    if(tableId == 'AwardsDashboardTable') {
      ws['!cols'][0] = { hidden: true };
    }
    // ws['!cols'][0] = { hidden: true };
    // ws['!cols'][1] = { hidden: true };

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    /* save to file */
    await XLSX.writeFile(wb, fileName + '.xls');
  }

  async exportToPDF(tableId: string, paginator: any, fileName: string = 'report.pdf') {
    const originalPageIndex = paginator.pageIndex;
    const totalPages = Math.ceil(paginator.length / paginator.pageSize);

    // First, measure table width for orientation
    const tableElement = document.getElementById(tableId);
    if (!tableElement) {
      console.error('Element not found:', tableId);
      return;
    }
    tableElement.scrollIntoView();
    const tableWidth = tableElement.scrollWidth;
    const orientation = tableWidth > 800 ? 'landscape' : 'portrait';
    const paper = tableWidth > 1600 ? 'a3' : 'a4';

    const pdf = new jsPDF(orientation, 'pt', paper);

    for (let i = 0; i < totalPages; i++) {
      paginator.pageIndex = i;
      paginator._changePageSize(paginator.pageSize); // Force table refresh

      await new Promise(r => setTimeout(r, 300)); // Small wait for rendering

      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tableElement.scrollWidth,
        windowHeight: tableElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 0.8); // Compressed JPEG
      const pageWidth = pdf.internal.pageSize.getWidth() - 40; // margins
      const pageHeight = pdf.internal.pageSize.getHeight() - 40; // margins
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);

      const imgWidth = pageWidth; // canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight, undefined, 'FAST');
    }

    paginator.pageIndex = originalPageIndex;
    paginator._changePageSize(paginator.pageSize); // Restore original view

    pdf.save(fileName + '.pdf');
  }

}
