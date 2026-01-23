import jsPDF from 'jspdf';
import { Tenant, Room } from '@/contexts/DataContext';

export const generateTenantPDF = (tenant: Tenant, room: Room | undefined) => {
  try {
    const pdf = new jsPDF();
    
    // Set colors
    const primaryColor = [59, 130, 246]; // blue-500
    const grayColor = [107, 114, 128]; // gray-500
    
    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('TENANT AGREEMENT FORM', 20, 20);
    
    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 30);
    
    let yPosition = 45;
    
    // Tenant Information Section
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('TENANT INFORMATION', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const tenantInfo: [string, string][] = [
      ['Full Name:', `${tenant.firstName || ''} ${tenant.lastName || ''}`],
      ['Email:', tenant.email || 'N/A'],
      ['Phone:', tenant.phone || 'N/A'],
      ['Aadhaar Number:', tenant.aadhaarNumber || 'N/A'],
      ['Join Date:', tenant.joinDate ? new Date(tenant.joinDate).toLocaleDateString('en-IN') : 'N/A'],
    ];
    
    tenantInfo.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.text(String(value), 80, yPosition);
      yPosition += 7;
    });
    
    // Address Information
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('ADDRESS INFORMATION', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const addressInfo: [string, string][] = [
      ['City:', tenant.city || 'N/A'],
      ['State:', tenant.state || 'N/A'],
      ['Pincode:', tenant.pincode || 'N/A'],
      ['Landmark:', tenant.landmark || 'N/A'],
    ];
    
    addressInfo.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.text(String(value), 80, yPosition);
      yPosition += 7;
    });
    
    // Room Information
    if (room) {
      yPosition += 5;
      pdf.setFontSize(12);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('ROOM DETAILS', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      const roomInfo: [string, string][] = [
        ['Room Number:', `#${room.roomNumber}`],
        ['Room Type:', room.type.charAt(0).toUpperCase() + room.type.slice(1)],
        ['AC Status:', room.isAC ? 'AC' : 'Non-AC'],
        ['Monthly Rent:', `₹${room.rent}`],
      ];
      
      roomInfo.forEach(([label, value]) => {
        pdf.text(label, 20, yPosition);
        pdf.text(String(value), 80, yPosition);
        yPosition += 7;
      });
    }
    
    // Token Money
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('FINANCIAL DETAILS', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Token/Security Money:', 20, yPosition);
    pdf.text(`₹${tenant.tokenMoney || 0}`, 80, yPosition);
    
    // Footer
    yPosition = 270;
    pdf.setFontSize(9);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text('This document is an official record of the rental agreement.', 20, yPosition);
    pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, yPosition + 6);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadTenantPDF = (tenant: Tenant, room: Room | undefined) => {
  try {
    const pdf = generateTenantPDF(tenant, room);
    const filename = `Tenant_${tenant.firstName}_${tenant.lastName}_${Date.now()}.pdf`;
    pdf.save(filename);
    console.log('✅ PDF downloaded:', filename);
  } catch (error) {
    console.error('❌ Error downloading PDF:', error);
    throw error;
  }
};
