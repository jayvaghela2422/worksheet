import { saveAs } from "file-saver";
import { useContext, useState } from "react";
import { QuestionContext } from "./../../context/questionContext"; // Assuming the path is correct
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  TextRun,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TabStopType,
  TabStopPosition,
  TextWrappingType,
  TextWrappingSide,
  TableLayoutType,
  convertInchesToTwip,
  WidthType,
} from "docx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import katex from "katex";
window.katex = katex;
import "katex/dist/katex.min.css";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MathMLToLaTeX } from 'mathml-to-latex';
import html2canvas from "html2canvas";
const HomeMain = () => {
  const [visible, setVisible] = useState(10);
  const {
    questions,
    setQuestions,
    filteredQuestions,
    noQuestionsFound,
    handleReset,
    imageUrl,
  } = useContext(QuestionContext);

  const handleCheckboxChange = (index, checked) => {
    setQuestions((prevState) => {
      const updatedQuestions = [...prevState];
      updatedQuestions[index].selected = checked;
      return updatedQuestions;
    });
  };

// Function to convert LaTeX to Base64
const latexToBase64 = async (equation) => {
  try {
    console.log("Converting LaTeX to Base64:", equation);
    const base64String = await latexToSVG(equation);
    return base64String;
  } catch (error) {
    console.error("Error converting LaTeX to Base64:", error);
    throw error;
  }
};


const preprocessMathML = (mathmlString) => {
  return mathmlString
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<mspace linebreak="newline">.*?<\/mspace>/g, '\\\\'); 
};


const convertMathMLContent = (htmlString) => {
  const mathmlRegex = /<math[^>]*>[\s\S]*?<\/math>/gi;
  return htmlString.replace(mathmlRegex, (match) => {
    const cleanedMathML = preprocessMathML(match);
    const latexString = MathMLToLaTeX.convert(cleanedMathML);
    return latexString; 
  });
};


// Function to convert LaTeX to SVG
const latexToSVG = (equation) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("equation", equation);
      const mathmlRegex = /<math[^>]*>[\s\S]*?<\/math>/gi;
      const hasMathML = mathmlRegex.test(equation);
      let svgString;

      if (hasMathML) {
        const latex = convertMathMLContent(equation);
        console.log("latex", latex);
        const renderedEquation = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
        });

        console.log("Rendered Equation:", renderedEquation);

        // Create a container to extract MathML
        const div = document.createElement("div");
        div.innerHTML = renderedEquation;

        // Extract MathML from the rendered equation
        const mathElement = div.querySelector("math");

        if (!mathElement) {
          console.error("Failed to extract MathML content:", renderedEquation);
          return reject(new Error("Failed to extract MathML content."));
        }

        const mathmlString = mathElement.outerHTML;
        console.log("mathml", mathmlString);

        svgString = `
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style='display:flex;justify-content:flex-start'>
          <style>
            math {
              display: inline !important;
            }
            div {
            font-size: 12px;
            font-weight:10;
            color:#262626;
            }
          </style>
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${mathmlString}
            </div>
          </foreignObject>
        </svg>
      `;
      } else {
        const div = document.createElement("div");
        div.innerHTML = equation;
        const styles = `
          figure {
            margin: 0;
          }
          table {
            border-collapse: collapse;
            width: auto;
          }
          table, th, td {
            border: 1px solid black;
          }
          th, td {
            padding-right: 10px;
            padding-left: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        `;
        svgString = `
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <style>
              ${styles}
              svg {
                background-color: white;
              }
              div {
               font-size: 12px;
               font-weight:10;
               color:#262626;
              }
            </style>
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                ${div.innerHTML}
              </div>
            </foreignObject>
          </svg>
        `;
      }

      const img = new Image();
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      img.src = svgUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; // You can keep this as is or adjust for higher quality
        canvas.height = img.height; // You can keep this as is or adjust for higher quality
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0); // Draw the image

        const base64 = canvas.toDataURL("image/png").split(",")[1];
        resolve(base64);
      };

      img.onerror = (error) => {
        console.error("Failed to load SVG image:", error);
        reject(new Error("Failed to load SVG image"));
      };
    } catch (error) {
      console.error("Error in latexToSVG function:", error);
      reject(error);
    }
  });
};
// Extract LaTeX from HTML
const extractLatex = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  const spans = div.querySelectorAll("span.ql-formula");

  spans.forEach((span) => {
    const latex = span.getAttribute("data-value");
    span.outerHTML = latex;
  });

  return div.innerHTML;
};

// Convert HTML to RTF
const htmlToRtfFunction = (html) => {
  const processedHtml = html;

  const rtf = processedHtml
    .replace(/<b>/g, "{\\b ")
       .replace(/<\/b>/g, "\\b0}")
       .replace(/<p>/g, "\n")
       .replace(/<\/p>/g, "\n")
       .replace(/<blockquote>/g, "\n")
       .replace(/<\/blockquote>/g, "\n")
       .replace(/<strong>/g, "")
       .replace(/<\/strong>/g, "")
       .replace(/<ul>/g, "")
       .replace(/<\/ul>/g, "")
       .replace(/<em>/g, "") // Assuming <em> tags are meant to be removed or handled differently
       .replace(/<\/em>/g, "")
       .replace(/<i>/g, "")
       .replace(/<\/i>/g, "") 
       .replace(/<s>/g, "")
       .replace(/<\/s>/g, "")
       .replace(/<u>/g, "")
       .replace(/<\/u>/g, "")
       .replace(/<h[1-6]>/g, "\n")
       .replace(/<\/h[1-6]>/g, "\n")
       .replace(/<br\s*\/?>/g, "\n")
       .replace(/<li[^>]*>(.*?)<\/li>/g, (match, content) => `\n• ${content.trim()}\n`)
       .replace(/\n\s*\n/g, "\n")
       .replace(/<math[^>]*>.*?<\/math>/g, (match) => match)
       .replace(/&nbsp;/g, ' ')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&amp;/g, '&')
       .replace(/&quot;/g, '"')
       .replace(/&apos;/g, "'");
  ;
    
  return rtf;
};

// Main document generation function
const generateDocument = async () => {
  const selectedQuestions = questions.filter((q) => q.selected);

  if (selectedQuestions.length === 0) {
    toast.error("Please select at least one question.");
    return;
  }
  
  let imageData = [];
  let questionData = [];
  let question_equationData = [];
  let answerData = [];
  let answer_equationData = [];
  let solutionData = [];
  let solution_equationData = [];

  for (const [index, question] of selectedQuestions.entries()) {
    console.log("question: ", question);

    const processedQuestion = extractLatex(question.question);
    const processedQuestionEquation = extractLatex(question.question_equation);
    const processedAnswer = extractLatex(question.answer);
    const processedAnswerEquation = extractLatex(question.answer_equation);
    const processedSolution = extractLatex(question.solution);
    const processedSolutionEquation = extractLatex(question.solution_equation);

    console.log("processedEquation: ", processedQuestionEquation);
    console.log("processedQuestion: ", processedQuestion);
    // Convert MathML in each section to base64 and HTML to RTF
    const questionRTF = await htmlToRtfFunction(processedQuestion);
    const processedQuestionEquationRTF = await htmlToRtfFunction(processedQuestionEquation);
    const processedAnswerEquationRTF = await htmlToRtfFunction(processedAnswerEquation);
    const processedSolutionEquationRTF = await htmlToRtfFunction(processedSolutionEquation);
    const answerRTF = await htmlToRtfFunction(processedAnswer);
    const solutionRTF = await htmlToRtfFunction(processedSolution);
    
    console.log("questionrtf", questionRTF);
    console.log("answerrtf", answerRTF);
    console.log("solutionrtf", solutionRTF);
    console.log("processedSolutionEquationRTF: ", processedSolutionEquationRTF);

    const questionSvg = await latexToBase64(processedQuestionEquationRTF);
    const answerSvg = await latexToBase64(processedAnswerEquationRTF);
    const solutionSvg = await latexToBase64(processedSolutionEquationRTF);

    console.log("svg: ", questionSvg);

    // Push data for each section
    questionData.push(questionRTF);
    if (question.image) {
       imageData.push(`${imageUrl}/${question.image}`);
    }
    question_equationData.push(questionSvg);
    answer_equationData.push(answerSvg);
    solution_equationData.push(solutionSvg);
    answerData.push(answerRTF);
    solutionData.push(solutionRTF);
    
    console.log("imgData", imageData);
    console.log("questionData: ", questionData);
  }

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
        before: 500,
        after: 500,
      },
    }),
  ];

  // Fetch image as Uint8Array
  async function fetchImageAsUint8Array(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        resolve(bytes);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  const parseHtmlTableToDocx = (htmlTable) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTable, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) {
      throw new Error('No table found in HTML.');
    }
  
    const rows = Array.from(table.querySelectorAll('tr'));
      const numCols = Math.max(...rows.map(row => row.querySelectorAll('td').length));
    
      // Calculate column widths based on the maximum content size
      const columnWidths = new Array(numCols).fill(0);
    
      // First pass: Calculate max content length for each column
      rows.forEach(row => {
        Array.from(row.querySelectorAll('td')).forEach((td, index) => {
          const cellWidth = td.textContent ? td.textContent.length * 200 : 500; // Approximate character width
          columnWidths[index] = Math.max(columnWidths[index] || 0, cellWidth);
        });
      });
    
      // Map rows to TableRow and TableCell
      const docRows = rows.map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td')).map((td, index) => {
          return new TableCell({
            children: [new Paragraph(td.textContent || '')],
            width: {
              size: columnWidths[index] || 100, // Default width if no column width calculated
              type: WidthType.DXA,
            },
            verticalAlign: 'center',
          });
        });
        
        return new TableRow({
          children: cells,
        });
      });
    
      return new Table({
        rows: docRows,
        columnWidths: columnWidths,
        alignment: AlignmentType.LEFT, // Left align the table
      });
  };
  

  // Function to convert HTML to DOCX paragraphs
  const convertHtmlToParagraphs = (htmlString) => {
    console.log("htmlString",htmlString)
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const children = Array.from(doc.body.childNodes);
    console.log("children", children);
    return children.map(child => {
      console.log("child nodename", child.nodeName);
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
  const questionParagraphs = await Promise.all(
    selectedQuestions.map(async (question, index) => [
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
      imageData[index]
        ? new Paragraph({
            children: [
              new ImageRun({
                data: await fetchImageAsUint8Array(imageData[index]),
                alignment: AlignmentType.LEFT,
                transformation: {
                  width: 250,
                  height: 200,
                },
              }),
            ],
            alignment: AlignmentType.LEFT,
          })
        : null,
      ...convertHtmlToParagraphs(questionData[index]),
      question_equationData[index]
        ? new Paragraph({
            children: [
              new ImageRun({
                data: Uint8Array.from(atob(question_equationData[index]), (c) => c.charCodeAt(0)),
                alignment: AlignmentType.LEFT,
                transformation: {
                  width: 250,
                  height: 200,
                },
              }),
            ],
            alignment: AlignmentType.LEFT,
          })
        : null,
    ])
  );

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
  const answerParagraphs = await Promise.all(
    selectedQuestions.map(async (question, index) => [
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
                alignment: AlignmentType.LEFT,
                transformation: {
                  width: 250,
                  height: 200,
                },
              }),
            ],
            alignment: AlignmentType.LEFT,
          })
        : null,
    ])
  );

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
  const solutionParagraphs = await Promise.all(
    selectedQuestions.map(async (question, index) => [
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
                alignment: AlignmentType.LEFT,
                transformation: {
                  width: 250,
                  height: 200,
                },
              }),
            ],
            alignment: AlignmentType.LEFT,
          })
        : null,
    ])
  );

  
  // Merge manual data, questions, answer key, answers, solution heading, and solutions paragraphs
  const finalDocumentContent = [
    ...manualDataParagraphs,
    ...questionParagraphs.flat(),
    answerKeyHeading,
    ...answerParagraphs.flat(),
    solutionHeading,
    ...solutionParagraphs.flat(),
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
};


  const selectedCount = questions.filter((q) => q.selected).length;

  // Function to load more posts
  const loadMore = () => {
    setVisible((prevVisible) => prevVisible + 10);
  };

  // my html parser
  
  

  
  
  
  
  
  
  
  const addBordersToTable = (html) => {
    return `
      <style>
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 20px
        }
        th, td {
          border: 1px solid black;
          padding: 2px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
      ${html}
    `;
  };
  
  return (
    <div className="">
      <Card className="w-[100%] p-5 min-h-screen rounded-none">
        {/* Selected Question Badge */}
        <div className="flex items-center justify-start gap-4 my-4">
          <Badge>Selected Question</Badge>{" "}
          <span className="py-[8px] px-[15px] text-white rounded-full selected bg-[var(--primary-color)]">
            {selectedCount}
          </span>
        </div>
        {/* Question Cards */}
        <div className="ques-wrap">
          {filteredQuestions?.length > 0 ? (
            <>
              {filteredQuestions ? (
                <>
                  {filteredQuestions.slice(0, visible).map((q, index) => (
                    <div className="mb-4" key={index}>
                      <Alert>
                        <div className="flex items-center my-4 space-x-2 q-check text-end">
                          <input
                            type="checkbox"
                            className="w-5 h-5 cursor-pointer"
                            checked={q.selected}
                            onChange={(e) =>
                              handleCheckboxChange(index, e.target.checked)
                            }
                          />
                          <label
                            htmlFor="checkbox"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 "
                          >
                            Select Question
                          </label>
                        </div>
                        <div className="mb-4 question-div">
                          <AlertTitle className="text-2xl">
                            Question:
                          </AlertTitle>
                          <img
                            className="w-[400px]"
                            src={`${imageUrl}/${q?.image}`}
                            alt=""
                          />

                          <AlertDescription
                            className="answer-text"
                            dangerouslySetInnerHTML={{
                              __html: q ?  addBordersToTable(q.question) : "",
                            }}
                          ></AlertDescription>

                          <AlertDescription
                            className="answer-text"
                            dangerouslySetInnerHTML={{
                              __html: q ?  addBordersToTable(q.question_equation) : "",
                            }}
                          ></AlertDescription>
                        </div>
                        <hr className="my-3" />
                        <Accordion type="single" collapsible>
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              <AlertTitle className="text-2xl ">
                                Answer:
                              </AlertTitle>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="mb-4 answer-div">
                                <AlertDescription
                                  className="answer-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.answer) : "",
                                  }}
                                ></AlertDescription>

                                <AlertDescription
                                  className="answer-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.answer_equation) : "",
                                  }}
                                ></AlertDescription>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              <AlertTitle className="text-2xl">
                                Solution:
                              </AlertTitle>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="my-3 solution-div">
                                <AlertDescription
                                  className="solution-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.solution) : "",
                                  }}
                                ></AlertDescription>

                                <AlertDescription
                                  className="solution-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.solution_equation) : "",
                                  }}
                                ></AlertDescription>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Alert>
                    </div>
                  ))}
                </>
              ) : (
                <>No Questions Found</>
              )}
            </>
          ) : (
            <>
              {noQuestionsFound ? (
                <>
                  <p className="text-3xl font-semibold text-center text-red-500">
                    No questions found matching the selected filters.
                  </p>
                </>
              ) : (
                <>
                  {questions.slice(0, visible).map((q, index) => (
                    <div className="mb-4" key={index}>
                      <Alert>
                        <div className="flex items-center my-4 space-x-2 q-check text-end">
                          <input
                            type="checkbox"
                            className="w-5 h-5 cursor-pointer"
                            checked={q.selected}
                            onChange={(e) =>
                              handleCheckboxChange(index, e.target.checked)
                            }
                          />
                          <label
                            htmlFor="checkbox"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 "
                          >
                            Select Question
                          </label>
                        </div>
                        <div className="mb-4 question-div">
                          <AlertTitle className="text-2xl">
                            Question:
                          </AlertTitle>
                          <img
                            className="w-[400px]"
                            src={`${imageUrl}/${q?.image}`}
                            alt=""
                          />

                          <AlertDescription
                            className="answer-text"
                            dangerouslySetInnerHTML={{
                              __html: q ?  addBordersToTable(q.question) : "",
                            }}
                          ></AlertDescription>

                          <AlertDescription
                            className="answer-text"
                            dangerouslySetInnerHTML={{
                              __html: q ?  addBordersToTable(q.question_equation) : "",
                            }}
                          ></AlertDescription>
                        </div>
                        <hr className="my-3" />
                        <Accordion type="single" collapsible>
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              <AlertTitle className="text-2xl ">
                                Answer:
                              </AlertTitle>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="mb-4 answer-div">
                                <AlertDescription
                                  className="answer-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.answer) : "",
                                  }}
                                ></AlertDescription>

                                <AlertDescription
                                  className="answer-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.answer_equation) : "",
                                  }}
                                ></AlertDescription>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              <AlertTitle className="text-2xl">
                                Solution:
                              </AlertTitle>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="my-3 solution-div">
                                <AlertDescription
                                  className="solution-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.solution) : "",
                                  }}
                                ></AlertDescription>

                                <AlertDescription
                                  className="solution-text"
                                  dangerouslySetInnerHTML={{
                                    __html: q ?  addBordersToTable(q.solution_equation) : "",
                                  }}
                                ></AlertDescription>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Alert>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {!noQuestionsFound && (
            <Button onClick={generateDocument}>Generate</Button>
          )}
          {noQuestionsFound && (
            <div className="mt-4 text-center">
              <Button onClick={handleReset}>Reset Filter</Button>
            </div>
          )}
          {questions.length > visible || filteredQuestions.length > visible ? (
            <div className="mt-4 text-center">
              <Button onClick={loadMore}>Load More</Button>
            </div>
          ) : (
            <div className="mt-4 text-2xl font-semibold text-center">
              No More Questions Found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HomeMain;
