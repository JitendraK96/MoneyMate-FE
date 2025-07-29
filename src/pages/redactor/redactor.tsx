import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Square, RotateCcw } from 'lucide-react';
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";

// Declare global types for PDF.js and jsPDF
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jspdf: any;
  }
}

interface RedactionArea {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}

interface PdfPage {
  canvas: HTMLCanvasElement;
  viewport: {
    width: number;
    height: number;
  };
  pageNumber: number;
}

const PDFRedactor = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [redactions, setRedactions] = useState<RedactionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF.js from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setPdfFile(file);
    setRedactions([]);
    setCurrentPage(0);

    const arrayBuffer = await file.arrayBuffer();
    
    if (window.pdfjsLib) {
      try {
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          pages.push({
            canvas: canvas,
            viewport: viewport,
            pageNumber: i
          });
        }
        
        setPdfPages(pages);
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF. Please try again.');
      }
    }
  };

  const drawPage = useCallback(() => {
    if (!pdfPages[currentPage] || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pageData = pdfPages[currentPage];

    // Set canvas size
    canvas.width = pageData.viewport.width;
    canvas.height = pageData.viewport.height;

    // Draw the PDF page
    ctx.drawImage(pageData.canvas, 0, 0);

    // Draw redactions for current page
    const currentPageRedactions = redactions.filter(r => r.page === currentPage);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    currentPageRedactions.forEach(redaction => {
      ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
      ctx.strokeRect(redaction.x, redaction.y, redaction.width, redaction.height);
    });
  }, [currentPage, pdfPages, redactions]);

  useEffect(() => {
    drawPage();
  }, [drawPage]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragMode) return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentPos = getMousePos(e);

    // Redraw everything
    drawPage();

    // Draw the current rectangle being drawn
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      startPos.x,
      startPos.y,
      currentPos.x - startPos.x,
      currentPos.y - startPos.y
    );
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragMode) return;

    const endPos = getMousePos(e);
    const width = endPos.x - startPos.x;
    const height = endPos.y - startPos.y;

    // Only add redaction if rectangle has meaningful size
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      const newRedaction = {
        page: currentPage,
        x: Math.min(startPos.x, endPos.x),
        y: Math.min(startPos.y, endPos.y),
        width: Math.abs(width),
        height: Math.abs(height),
        id: Date.now()
      };

      setRedactions(prev => [...prev, newRedaction]);
    }

    setIsDrawing(false);
  };

  const clearRedactions = () => {
    setRedactions([]);
  };

  const downloadRedactedPDF = async () => {
    if (!pdfPages.length) {
      alert('No PDF loaded');
      return;
    }

    // Create script element for jsPDF
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      
      pdfPages.forEach((pageData, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        // Create a temporary canvas for this page with redactions
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        tempCanvas.width = pageData.viewport.width;
        tempCanvas.height = pageData.viewport.height;

        // Draw the original page
        tempCtx.drawImage(pageData.canvas, 0, 0);

        // Draw redactions for this page
        const pageRedactions = redactions.filter(r => r.page === index);
        tempCtx.fillStyle = 'white';
        pageRedactions.forEach(redaction => {
          tempCtx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height);
        });

        // Add the canvas to PDF
        const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (tempCanvas.height * pdfWidth) / tempCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      });

      // Download the PDF
      pdf.save('redacted-document.pdf');
    };

    document.head.appendChild(script);
  };

  return (
    <Page
      title="PDF Redactor"
      subTitle="Upload and redact sensitive information from PDF documents"
    >
      <Card
        title="Upload PDF Document"
        cardContent={
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-[var(--content-border)] rounded-lg hover:border-[var(--content-textprimary)] transition-colors flex items-center justify-center gap-2 text-[var(--content-textsecondary)] hover:text-[var(--content-textprimary)] cursor-pointer"
            >
              <Upload size={24} />
              <span>{pdfFile ? `Loaded: ${pdfFile.name}` : 'Click to upload PDF file'}</span>
            </div>
          </div>
        }
      />

      {pdfPages.length > 0 && (
        <>
          <Card
            title="Redaction Controls"
            headerContent={
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--content-textsecondary)]">
                  Page {currentPage + 1} of {pdfPages.length}
                </span>
                <Button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  variant="outline"
                  title="←"
                  className="w-auto px-3"
                />
                <Button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                  disabled={currentPage === pdfPages.length - 1}
                  variant="outline"
                  title="→"
                  className="w-auto px-3"
                />
              </div>
            }
            cardContent={
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    onClick={() => setDragMode(!dragMode)}
                    variant={dragMode ? "default" : "outline"}
                    title={
                      <div className="flex items-center gap-2">
                        <Square size={16} />
                        {dragMode ? 'Drawing Mode ON' : 'Enable Drawing'}
                      </div>
                    }
                    className="w-auto"
                  />
                  
                  <Button
                    type="button"
                    onClick={clearRedactions}
                    variant="destructive"
                    title={
                      <div className="flex items-center gap-2">
                        <RotateCcw size={16} />
                        Clear All
                      </div>
                    }
                    className="w-auto"
                  />
                  
                  <Button
                    type="button"
                    onClick={downloadRedactedPDF}
                    title={
                      <div className="flex items-center gap-2">
                        <Download size={16} />
                        Download Redacted PDF
                      </div>
                    }
                    className="w-auto"
                  />
                </div>

                {dragMode && (
                  <div className="p-3 bg-[var(--content-background)] border border-[var(--content-border)] rounded-lg">
                    <p className="text-[var(--content-textprimary)] text-sm">
                      <strong>Drawing Mode Active:</strong> Click and drag to create white rectangles over content you want to redact.
                    </p>
                  </div>
                )}

                <div className="text-sm text-[var(--content-textsecondary)]">
                  {redactions.length} redaction{redactions.length !== 1 ? 's' : ''} applied
                </div>
              </div>
            }
          />

          <Card
            title="PDF Viewer"
            cardContent={
              <div className="border border-[var(--content-border)] rounded-lg p-4 bg-[var(--content-background)] overflow-auto max-h-[800px]">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className={`border border-[var(--content-border)] shadow-lg bg-white ${dragMode ? 'cursor-crosshair' : 'cursor-default'}`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            }
          />
        </>
      )}
    </Page>
  );
};

export default PDFRedactor;