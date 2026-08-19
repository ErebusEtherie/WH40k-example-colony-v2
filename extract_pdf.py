#!/usr/bin/env python3
"""Extract text and tables from the Rogue Trader Colony Tracking Sheet PDF."""

import pdfplumber

PDF_PATH = "x:/thetrove.net/Books/Warhammer 40,000 RPGs/Rogue Trader/Sheets and Supplements/Rogue Trader - Colony Tracking Sheet.pdf"
OUTPUT_PATH = "extracted_pdf_full.txt"

def extract_pdf():
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")
        
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            for i, page in enumerate(pdf.pages):
                f.write(f'\n{"="*60}\n')
                f.write(f'PAGE {i+1}\n')
                f.write(f'{"="*60}\n\n')
                
                # Extract text
                text = page.extract_text()
                if text:
                    f.write("TEXT CONTENT:\n")
                    f.write(text)
                    f.write("\n\n")
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    f.write("TABLES:\n")
                    for j, table in enumerate(tables):
                        f.write(f'\n--- Table {j+1} ---\n')
                        for row_idx, row in enumerate(table):
                            cells = [str(cell).strip() if cell else '' for cell in row]
                            f.write(' | '.join(cells) + '\n')
                        f.write('\n')
        
        print(f"Extraction complete. Output saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    extract_pdf()