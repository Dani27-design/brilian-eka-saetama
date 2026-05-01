import { Maintenance } from "@/types/maintenances";
import { formatToWIBExport } from "./dateFormatter";

/**
 * Certificate data interface for Word document generation
 */
export interface CertificateData {
  contractNumber: string;
  contractName: string;
  customerName: string;
  customerAddress: string;
  productNumber: string;
  productName: string;
  productBrand: string;
  productType: string;
  productCapacity: string;
  location: string;
  inspectionDate: string;
  expirationDate: string;
  inspectorName: string;
  engineerNames: string[];
  checklist: Array<{
    item: string;
    status: boolean;
    remarks?: string;
  }>;
  photos: string[];
  certificateNumber: string;
  issueDate: string;
}

/**
 * Generates Word document content for certificate
 * Since we can't use external libraries in this environment,
 * we'll generate HTML content that can be converted to Word
 */
export function generateWordCertificateHTML(certificateData: CertificateData): string {
  const {
    contractNumber,
    contractName,
    customerName,
    customerAddress,
    productNumber,
    productName,
    productBrand,
    productType,
    productCapacity,
    location,
    inspectionDate,
    expirationDate,
    inspectorName,
    engineerNames,
    checklist,
    photos,
    certificateNumber,
    issueDate,
  } = certificateData;

  // Generate checklist HTML
  const checklistHTML = checklist
    .map(
      (item) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.item}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
            item.status ? "✓ BAIK" : "✗ NOK"
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.remarks || "-"}</td>
        </tr>
      `
    )
    .join("");

  // Generate photos HTML
  const photosHTML = photos
    .map(
      (photo, index) => `
        <div style="margin: 10px 0; page-break-inside: avoid;">
          <p style="font-weight: bold; margin-bottom: 5px;">Foto ${index + 1}:</p>
          <img src="${photo}" alt="Inspection Photo ${index + 1}" style="max-width: 400px; max-height: 300px; border: 1px solid #ddd;">
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Sertifikat Inspeksi - ${certificateNumber}</title>
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.6; 
          margin: 0; 
          padding: 20px;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 5px;
        }
        .document-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin: 20px 0;
          text-transform: uppercase;
        }
        .certificate-number { 
          font-size: 14px; 
          font-weight: bold; 
          margin: 10px 0;
        }
        .section { 
          margin: 20px 0; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #2563eb;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .info-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0;
        }
        .info-table td { 
          padding: 8px; 
          border: 1px solid #ddd; 
          vertical-align: top;
        }
        .info-table .label { 
          background-color: #f8f9fa; 
          font-weight: bold; 
          width: 200px;
        }
        .checklist-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0;
        }
        .checklist-table th { 
          background-color: #2563eb; 
          color: white; 
          padding: 10px; 
          border: 1px solid #ddd;
          text-align: center;
        }
        .checklist-table td { 
          padding: 8px; 
          border: 1px solid #ddd;
        }
        .footer { 
          margin-top: 40px; 
          border-top: 2px solid #e5e7eb; 
          padding-top: 20px;
        }
        .signature-area { 
          display: flex; 
          justify-content: space-between; 
          margin-top: 30px;
        }
        .signature-box { 
          width: 200px; 
          text-align: center;
        }
        .signature-line { 
          border-top: 1px solid #333; 
          margin-top: 60px; 
          padding-top: 5px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">PT BRILIAN EKA SAETAMA</div>
        <p>Jl. Raya Industri No. 123, Jakarta<br>
        Telp: (021) 1234-5678 | Email: info@brilian-eka.com</p>
        <div class="document-title">SERTIFIKAT INSPEKSI</div>
        <div class="certificate-number">No. Sertifikat: ${certificateNumber}</div>
      </div>

      <div class="section">
        <div class="section-title">Informasi Kontrak</div>
        <table class="info-table">
          <tr>
            <td class="label">No. Kontrak</td>
            <td>${contractNumber}</td>
          </tr>
          <tr>
            <td class="label">Nama Kontrak</td>
            <td>${contractName}</td>
          </tr>
          <tr>
            <td class="label">Nama Customer</td>
            <td>${customerName}</td>
          </tr>
          <tr>
            <td class="label">Alamat Customer</td>
            <td>${customerAddress}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Informasi Produk</div>
        <table class="info-table">
          <tr>
            <td class="label">No. Produk</td>
            <td>${productNumber}</td>
          </tr>
          <tr>
            <td class="label">Nama Produk</td>
            <td>${productName}</td>
          </tr>
          <tr>
            <td class="label">Merk Produk</td>
            <td>${productBrand}</td>
          </tr>
          <tr>
            <td class="label">Jenis Produk</td>
            <td>${productType}</td>
          </tr>
          <tr>
            <td class="label">Kapasitas</td>
            <td>${productCapacity}</td>
          </tr>
          <tr>
            <td class="label">Lokasi</td>
            <td>${location}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Expired</td>
            <td>${expirationDate}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Hasil Inspeksi</div>
        <table class="info-table">
          <tr>
            <td class="label">Tanggal Inspeksi</td>
            <td>${inspectionDate}</td>
          </tr>
          <tr>
            <td class="label">Petugas Inspeksi</td>
            <td>${inspectorName}</td>
          </tr>
          <tr>
            <td class="label">Engineer</td>
            <td>${engineerNames.join(", ") || "N/A"}</td>
          </tr>
        </table>

        <div style="margin-top: 20px;">
          <strong>Detail Checklist Inspeksi:</strong>
          <table class="checklist-table">
            <thead>
              <tr>
                <th>Item Inspeksi</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${checklistHTML}
            </tbody>
          </table>
        </div>
      </div>

      ${photos.length > 0 ? `
      <div class="section">
        <div class="section-title">Dokumentasi Foto</div>
        ${photosHTML}
      </div>
      ` : ''}

      <div class="footer">
        <div class="section-title">Validasi Sertifikat</div>
        <table class="info-table">
          <tr>
            <td class="label">Tanggal Terbit</td>
            <td>${issueDate}</td>
          </tr>
          <tr>
            <td class="label">Status Sertifikat</td>
            <td><strong>SAH DAN BERLAKU</strong></td>
          </tr>
        </table>

        <div class="signature-area">
          <div class="signature-box">
            <p><strong>Petugas Inspeksi</strong></p>
            <div class="signature-line">${inspectorName}</div>
          </div>
          <div class="signature-box">
            <p><strong>Manager</strong></p>
            <div class="signature-line">_________________</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Downloads Word document from HTML content
 */
export function downloadWordCertificate(htmlContent: string, filename: string): void {
  try {
    // Create a blob with HTML content that Word can open
    const blob = new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.doc`;
    link.style.display = "none";

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`✅ Word certificate downloaded: ${filename}.doc`);
  } catch (error) {
    console.error("Error downloading Word certificate:", error);
    throw new Error("Gagal mengunduh sertifikat Word");
  }
}

/**
 * Generates merged Word document for multiple certificates
 */
export function generateMergedWordCertificates(certificatesData: CertificateData[], filename: string): void {
  try {
    const mergedHTML = certificatesData
      .map((cert, index) => {
        const html = generateWordCertificateHTML(cert);
        // Extract body content and add page break
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        const bodyContent = bodyMatch ? bodyMatch[1] : html;
        
        return index === 0 
          ? bodyContent 
          : `<div class="page-break"></div>${bodyContent}`;
      })
      .join("");

    // Create complete HTML document
    const completeHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Sertifikat Inspeksi Gabungan</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px;
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 5px;
          }
          .document-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin: 20px 0;
            text-transform: uppercase;
          }
          .certificate-number { 
            font-size: 14px; 
            font-weight: bold; 
            margin: 10px 0;
          }
          .section { 
            margin: 20px 0; 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
          }
          .info-table td { 
            padding: 8px; 
            border: 1px solid #ddd; 
            vertical-align: top;
          }
          .info-table .label { 
            background-color: #f8f9fa; 
            font-weight: bold; 
            width: 200px;
          }
          .checklist-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
          }
          .checklist-table th { 
            background-color: #2563eb; 
            color: white; 
            padding: 10px; 
            border: 1px solid #ddd;
            text-align: center;
          }
          .checklist-table td { 
            padding: 8px; 
            border: 1px solid #ddd;
          }
          .footer { 
            margin-top: 40px; 
            border-top: 2px solid #e5e7eb; 
            padding-top: 20px;
          }
          .signature-area { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px;
          }
          .signature-box { 
            width: 200px; 
            text-align: center;
          }
          .signature-line { 
            border-top: 1px solid #333; 
            margin-top: 60px; 
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        ${mergedHTML}
      </body>
      </html>
    `;

    downloadWordCertificate(completeHTML, filename);
  } catch (error) {
    console.error("Error generating merged Word certificates:", error);
    throw new Error("Gagal membuat sertifikat Word gabungan");
  }
}

/**
 * Converts inspection data to certificate data format
 */
export function convertToCertificateData(
  inspection: any,
  contractData: any,
  productData: any,
  maintenanceData: any
): CertificateData {
  const now = new Date();
  const cleanContract = String(inspection.contractNumber || "0").replace(/[^A-Z0-9]/gi, '');
  const cleanProduct = String(inspection.productNumber || "0").replace(/[^A-Z0-9]/gi, '');
  const certificateNumber = `CERT-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${cleanContract}-${cleanProduct}`;

  return {
    contractNumber: inspection.contractNumber || "N/A",
    contractName: inspection.contractName || "N/A",
    customerName: contractData?.customerData?.name || contractData?.customerName || "N/A",
    customerAddress: contractData?.customerData?.address || contractData?.customerAddress || "N/A",
    productNumber: inspection.productNumber || "N/A",
    productName: inspection.productName || "N/A",
    productBrand: inspection.productBrand || "N/A",
    productType: inspection.productType || "N/A",
    productCapacity: inspection.capacity || productData?.specs?.capacity || "N/A",
    location: inspection.location || "N/A",
    inspectionDate: inspection.inspectionDate || formatToWIBExport(now),
    expirationDate: inspection.expirationDate || "N/A",
    inspectorName: inspection.inspectorName || "N/A",
    engineerNames: inspection.engineerNames || [],
    checklist: maintenanceData?.inspection?.checklist || [],
    photos: (() => {
      const inspectionPhotos = maintenanceData?.inspection?.photos || [];
      if (inspectionPhotos.length > 0) return inspectionPhotos;
      const checklist = maintenanceData?.inspection?.checklist || [];
      return checklist.reduce((all: string[], item: any) => {
        if (item.photos && Array.isArray(item.photos)) return [...all, ...item.photos];
        return all;
      }, []);
    })(),
    certificateNumber,
    issueDate: formatToWIBExport(now),
  };
}