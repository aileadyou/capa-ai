import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { ParticleBackground } from "@/components/ParticleBackground";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate();

  const faqSections = [
    {
      category: "Getting Started",
      items: [
        {
          question: "What is Lead Stream?",
          answer: "Lead Stream is a bioactivity data processing pipeline designed for medicinal chemists and data scientists. It transforms raw bioactivity data (ChEMBL format) into clean, ML-ready datasets by applying standardized cleaning, filtering, and normalization steps."
        },
        {
          question: "What data formats are supported?",
          answer: "Lead Stream supports CSV files in ChEMBL format with semicolon delimiters. You can upload files directly or provide download URLs. The data should contain columns for Molecule ChEMBL ID, SMILES, Standard Value, Standard Relation, Molecular Weight, and Assay ChEMBL ID."
        },
        {
          question: "Do I need to complete all pipeline steps?",
          answer: "No. While the recommended workflow is Data Collection → Standard Cleaning → Filtering → Selective Cleaning → Grouping & Sorting, some steps are optional. Standard Cleaning is essential, but Filtering and Selective Cleaning can be skipped depending on your data quality requirements."
        }
      ]
    },
    {
      category: "Pipeline Steps",
      items: [
        {
          question: "What does Standard Cleaning do?",
          answer: "Standard Cleaning removes rows with missing SMILES or Standard Values, converts IC50 values (in nM) to pIC50 units using logarithmic transformation, concatenates data from multiple files, and removes duplicate molecules based on SMILES strings."
        },
        {
          question: "When should I use Filtering?",
          answer: "Use Filtering when you need to ensure measurement quality and drug-likeness. It filters for exact measurements (Standard Relation = '=') and restricts molecular weight to a specified range (default 100-750 Da), which is typical for drug candidates."
        },
        {
          question: "What is Selective Cleaning?",
          answer: "Selective Cleaning preserves multiple assay measurements per molecule instead of removing duplicates. This approach retains statistical diversity and has been shown to improve AI/ML model performance by providing more training data per compound."
        },
        {
          question: "What happens in Grouping & Sorting?",
          answer: "This step groups data by Assay ID and SMILES, calculates the maximum pIC50 for each group, and sorts molecules by the number of assays they appear in. This prioritizes compounds with more experimental data, which are typically more reliable."
        }
      ]
    },
    {
      category: "Technical Details",
      items: [
        {
          question: "What is pIC50 and why convert to it?",
          answer: "pIC50 is the negative logarithm (base 10) of IC50 in molar units. Converting to pIC50 provides a more intuitive scale where higher values indicate greater potency, and it normalizes the data for better ML model training. For example, IC50 = 1 nM converts to pIC50 ≈ 9."
        },
        {
          question: "Why is molecular weight important?",
          answer: "Molecular weight is a key descriptor for drug-likeness. Most successful oral drugs have molecular weights between 180-500 Da. Filtering by molecular weight (100-750 Da) helps focus on compounds with favorable pharmacokinetic properties."
        },
        {
          question: "What are SMILES strings?",
          answer: `SMILES (Simplified Molecular Input Line Entry System) is a text notation for representing chemical structures. For example, "CCO" represents ethanol. SMILES are used to identify unique molecules and check for duplicates in the dataset.`
        },
        {
          question: "How are duplicates identified?",
          answer: "Duplicates are identified based on identical SMILES strings. In Standard Cleaning and Filtering, only one entry per unique SMILES is kept. In Selective Cleaning, duplicates are preserved to retain multiple measurements per molecule."
        }
      ]
    },
    {
      category: "Data Quality & Best Practices",
      items: [
        {
          question: "Should I use Standard or Selective Cleaning?",
          answer: "Use Standard Cleaning for general purposes when you want a clean, deduplicated dataset. Use Selective Cleaning when building ML models that benefit from multiple measurements per molecule, as research shows this can improve model performance."
        },
        {
          question: "What is a good molecular weight range?",
          answer: "The default range of 100-750 Da is suitable for most drug discovery projects. You can adjust this based on your target: smaller ranges (200-500 Da) for oral drugs, or wider ranges if exploring other modalities like biologics."
        },
        {
          question: "How do I handle missing data?",
          answer: "The Standard Cleaning step automatically removes rows with missing SMILES or Standard Values. These are essential fields for the pipeline. If other fields are missing, they may be retained but won't affect core processing."
        },
        {
          question: "Can I download intermediate results?",
          answer: "Yes! Each step provides a download button to export the processed data as CSV files. This allows you to inspect results at each stage or use intermediate outputs for other analyses."
        }
      ]
    },
    {
      category: "Troubleshooting",
      items: [
        {
          question: "My data upload is failing. What should I do?",
          answer: "Ensure your CSV files use semicolon delimiters and contain the required columns. Check that file sizes are under 20MB. If using URLs, verify they are publicly accessible and point to CSV files, not HTML pages."
        },
        {
          question: "Processing is taking too long. Is this normal?",
          answer: "Processing time depends on dataset size. Files with 10,000+ rows may take 30-60 seconds. If processing exceeds 2 minutes, try refreshing the page and running the step again. Check the console for any error messages."
        },
        {
          question: "I see 'No data found' after processing. Why?",
          answer: "This usually means all rows were filtered out. Common causes: (1) No exact measurements (Standard Relation ≠ '='), (2) All molecules outside the molecular weight range, (3) All rows had missing required fields. Try adjusting filter parameters or checking your source data quality."
        },
        {
          question: "How do I reset my progress?",
          answer: "You can reset your pipeline progress from the home page using the 'Reset Progress' button. This clears all step completion markers but does not delete your processed datasets from the database."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                FAQ & Help
              </h1>
            </div>
            <p className="text-muted-foreground">
              Frequently asked questions about the bioactivity data processing pipeline
            </p>
          </div>

          <div className="space-y-6">
            {faqSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {section.category}
                </h2>
                
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${sectionIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left hover:text-primary">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>

          <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Check out our technical glossary for detailed explanations of scientific terms and concepts.
            </p>
            <button
              onClick={() => navigate("/stream/glossary")}
              className="text-primary hover:underline font-medium"
            >
              View Glossary →
            </button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
