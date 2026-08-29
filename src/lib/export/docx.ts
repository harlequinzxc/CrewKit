import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { MenuSection } from '../sq/types';

export async function exportToDOCX(
  flightNo: string,
  dateFormatted: string,
  cabin: string,
  sections: MenuSection[],
  includeDescriptions = true,
  filename: string
): Promise<boolean> {
  try {
    const docChildren: Paragraph[] = [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({
            text: `SINGAPORE AIRLINES INFLIGHT MENU`,
            bold: true,
            size: 28,
            font: 'Arial',
          }),
        ],
      }),
      // Flight Subheader
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `${flightNo} · ${dateFormatted} · ${cabin.toUpperCase()}`,
            italics: true,
            size: 22,
            font: 'Arial',
          }),
        ],
      }),
    ];

    // Menu Sections & Items
    sections
      .filter((s) => !s.hidden)
      .forEach((section) => {
        // Section Header
        docChildren.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: section.title.toUpperCase(),
                bold: true,
                size: 24,
                font: 'Arial',
              }),
            ],
          })
        );

        // Section Items
        section.items
          .filter((item) => !item.hidden)
          .forEach((item) => {
            docChildren.push(
              new Paragraph({
                spacing: { before: 80, after: 40 },
                children: [
                  new TextRun({
                    text: `• ${item.title}`,
                    bold: true,
                    size: 20,
                    font: 'Arial',
                  }),
                ],
              })
            );

            if (includeDescriptions && item.description) {
              docChildren.push(
                new Paragraph({
                  spacing: { after: 120 },
                  indent: { left: 360 },
                  children: [
                    new TextRun({
                      text: item.description,
                      italics: true,
                      size: 18,
                      color: '555555',
                      font: 'Arial',
                    }),
                  ],
                })
              );
            }
          });
      });

    // Footer note
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: `— CrewKit Inflight Formatter Slip —`,
            size: 16,
            color: '888888',
            font: 'Arial',
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const file = new File([blob], `${filename}.docx`, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return true;
      } catch {
        // Fall back to direct download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('DOCX export failed', err);
    return false;
  }
}
