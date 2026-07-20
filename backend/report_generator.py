import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import datetime

def generate_pdf_report(filename, result):
    os.makedirs("reports", exist_ok=True)
    report_filename = f"reports/report_{os.path.splitext(filename)[0]}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    
    c = canvas.Canvas(report_filename, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "Deepfake Analysis Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(50, height - 100, f"File Name: {filename}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 140, "Analysis Results")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 160, f"Prediction: {result['prediction']}")
    c.drawString(50, height - 180, f"Fake Probability: {result['fake_probability'] * 100:.2f}%")
    c.drawString(50, height - 200, f"Real Probability: {result['real_probability'] * 100:.2f}%")
    c.drawString(50, height - 220, f"Confidence: {result['confidence']}%")
    c.drawString(50, height - 240, f"Risk Level: {result['risk_level']}")
    c.drawString(50, height - 260, f"Frames Analyzed: {result['frames_analyzed']}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 300, "Methodology Summary")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 320, "1. Media uploaded securely to the assessment engine.")
    c.drawString(50, height - 340, "2. Sequence of frames consistently extracted across the video timeline.")
    c.drawString(50, height - 360, "3. Facial region detected using MediaPipe and normalized.")
    c.drawString(50, height - 380, "4. Regions fed into Neural Network for Spatiotemporal Deepfake Analysis.")
    c.drawString(50, height - 400, "5. Outputs aggregated to calculate the overall prediction.")
    
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(colors.red)
    disclaimer_text = "Disclaimer: This system provides AI-based prediction and should be used as an "
    disclaimer_text2 = "assistive forensic tool, not as absolute legal evidence."
    c.drawString(50, 100, disclaimer_text)
    c.drawString(50, 85, disclaimer_text2)
    
    c.save()
    return report_filename
