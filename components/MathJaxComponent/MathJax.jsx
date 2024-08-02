// /* eslint-disable react/prop-types */
// import { useEffect, useState } from "react";

// const MathJax = ({ children }) => {
//   const [mathJaxReady, setMathJaxReady] = useState(false);

//   useEffect(() => {
//     if (window.MathJax) {
//       window.MathJax.startup.promise.then(() => {
//         setMathJaxReady(true);
//       });
//     } else {
//       console.error("MathJax is not loaded.");
//     }
//   }, []);

//   useEffect(() => {
//     if (mathJaxReady) {
//       window.MathJax.typesetPromise([document.body]).catch((err) =>
//         console.error(err)
//       );
//     }
//   }, [mathJaxReady, children]);

//   if (!mathJaxReady) {
//     return <div>Loading MathJax...</div>;
//   }

//   return <div>{children}</div>;
// };

// export default MathJax;





const nameDateParagraph = new Paragraph({
  text: 'Name: ______________________________\t\t\t\tDate: ___________',
  alignment: AlignmentType.LEFT,
  tabStops: [
    {
      type: TabStopType.RIGHT,
      position: 2000, // Align Date to the right margin
    },
  ],
  spacing: { after: 400 },
});

// Create paragraphs for manual data section
const manualDataParagraphs = [
  nameDateParagraph,
  new Paragraph({
    children: [
      new TextRun({
        text: 'EM Final revision WA2',
        bold: true,
        underline: {
          type: "single",
        },
        color: "000000", // Hex color for black
      }),
    ],
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.CENTER,
    spacing: {
      before:500,
      after: 500,
    },
  }),
];

const parseHtmlTableToDocx = (htmlTable) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlTable, 'text/html');
  const table = doc.querySelector('table');
  
  if (!table) {
    throw new Error('No table found in HTML.');
  }

  const rows = Array.from(table.querySelectorAll('tr')).map((tr) => {
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => {
      return new TableCell({
        width: {
          type:WidthType.AUTO,
          size:100
        },
        children: [new Paragraph({
          text:`${td.textContent}` || ''},
        )],
        verticalAlign:'center',
      });
    });

    return new TableRow({
      children: cells,
    });
  });

  return new Table({
    rows: rows,
    layout:'autofit',
    columnWidths:[100],
    alignment: AlignmentType.LEFT, // Center the table
  });
};

// Function to convert HTML to DOCX paragraphs
const convertHtmlToParagraphs = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const children = Array.from(doc.body.childNodes);
  console.log("children",children)
  return children.map(child => {
    console.log("child nodename",child.nodeName)
    if (child.nodeName === 'FIGURE') {
      return parseHtmlTableToDocx(child.outerHTML);
    }
    
    if (child.nodeName === 'P') {
      return new Paragraph(child.textContent || '');
    }

    if (child.nodeName === 'B') {
      return new Paragraph({
        children: [new TextRun({
          text: child.textContent || '',
          bold: true,
        })],
      });
    }

    return new Paragraph(child.textContent || '');
  });
};

// Create paragraphs for questions section
const questionParagraphs = selectedQuestions.flatMap((question, index) => [
  new Paragraph({
    children: [
      new TextRun({
        text: `Question ${index + 1}`,
        bold: true,
        underline: {
          type: "single",
        },
        color: "000000", // Hex color for black
      }),
    ],
    heading: HeadingLevel.HEADING_3,
    spacing: {
      after: 50,
      before: 200,
    },
  }),
    new Paragraph({
             children: [
               new ImageRun({
                 data: htmlParser(questionData[index]),
                 transformation: { width: 600, height: 400 }, // Adjust size as needed
                 alignment: AlignmentType.CENTER,
               }),
             ],
             alignment: AlignmentType.CENTER,
             spacing: { after: 200, before: 200 },
    }),
  question_equationData[index]
   ?  new Paragraph({
            children: [
              new ImageRun({
                data: htmlParser(question_equationData[index]),
                transformation: { width: 600, height: 400 }, // Adjust size as needed
                alignment: AlignmentType.CENTER,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
   })
   : null,
]);

// Create heading for Answer Key section
const answerKeyHeading = new Paragraph({
  children: [
    new TextRun({
      text: "[Answer Key]",
      bold: true,
      color: "FF0000", // Hex color for black
    }),
  ],
  heading: HeadingLevel.HEADING_3,
  alignment: AlignmentType.LEFT,
  spacing: {
    after: 500,
  },
  pageBreakBefore: true,
});

// Create paragraphs for answers section
const answerParagraphs = selectedQuestions.flatMap((question, index) => [
  new Paragraph({
    children: [
      new TextRun({
        text: `Answer ${index + 1}`,
        bold: true,
        underline: {
          type: "single",
        },
        color: "000000", // Hex color for black
      }),
    ],
    heading: HeadingLevel.HEADING_3,
    spacing: {
      after: 50,
      before: 200,
    },
  }),
 ...convertHtmlToParagraphs(answerData[index]),
  answer_equationData[index]
    ? new Paragraph({
        children: [
          new ImageRun({
            data: Uint8Array.from(atob(answer_equationData[index]), (c) => c.charCodeAt(0)),
            transformation: {
              width: 400,
              height: 200//
            },
            alignment: AlignmentType.LEFT,
          }),
        ],
        alignment: AlignmentType.LEFT, // Center the paragraph
        spacing: {
          after: 200,
          before: 200,
        },
      })
    : null,
]);

// Create heading for Solution section
const solutionHeading = new Paragraph({
  children: [
    new TextRun({
      text: "[Solution]",
      bold: true,
      color: "FF0000", // Hex color for black
    }),
  ],
  heading: HeadingLevel.HEADING_3,
  alignment: AlignmentType.LEFT,
  spacing: {
    after: 500,
  },
  pageBreakBefore: true,
});

// Create paragraphs for solutions section
const solutionParagraphs = selectedQuestions.flatMap((question, index) => [
  new Paragraph({
    children: [
      new TextRun({
        text: `Solution ${index + 1}`,
        bold: true,
        underline: {
          type: "single",
        },
        color: "000000", // Hex color for black
      }),
    ],
    heading: HeadingLevel.HEADING_3,
    spacing: {
      after: 50,
      before: 200,
    },
  }),
  new Paragraph({
    text: solutionData[index],
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      after: 100,
    },
  }),
  solution_equationData[index]
    ? new Paragraph({
      children: [
        new ImageRun({
          data: Uint8Array.from(atob(solution_equationData[index]), (c) => c.charCodeAt(0)),
          transformation: {
            width: 400,
            height: 200//
          },
          alignment: AlignmentType.LEFT,
        }),
      ],
      alignment: AlignmentType.LEFT, // Center the paragraph
      spacing: {
        after: 200,
        before: 200,
      },
      })
    : null,
]);

// Merge manual data, questions, answer key, answers, solution heading, and solutions paragraphs
const finalDocumentContent = [
  ...manualDataParagraphs,
  ...questionParagraphs,
  answerKeyHeading,
  ...answerParagraphs,
  solutionHeading,
  ...solutionParagraphs,
];

// Create document
const doc = new Document({
  sections: [
    {
      properties: {},
      children: finalDocumentContent.filter(Boolean), // Filter out any null paragraphs
    },
  ],
});

// Generate and download the document
Packer.toBlob(doc)
  .then((blob) => {
    saveAs(blob, "output.docx");
  })
  .catch((error) => {
    console.error("Error generating document:", error);
  });