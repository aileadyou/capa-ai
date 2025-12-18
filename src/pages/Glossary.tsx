import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { ParticleBackground } from "@/components/ParticleBackground";
import { BookOpen, Beaker, Ruler, Dna } from "lucide-react";

const Glossary = () => {
  const terms = [
    {
      icon: Beaker,
      term: "pIC50",
      definition: "The negative logarithm (base 10) of the IC50 value expressed in molar units. It provides a more intuitive scale where higher values indicate greater potency. For example, an IC50 of 1 nM converts to a pIC50 of 9.",
      formula: "pIC50 = -log10(IC50 in molar units)"
    },
    {
      icon: Beaker,
      term: "IC50",
      definition: "The half-maximal inhibitory concentration. It represents the concentration of a compound required to inhibit a biological process by 50%. Typically measured in nanomolar (nM) units.",
      formula: "Lower IC50 = Higher potency"
    },
    {
      icon: Dna,
      term: "SMILES",
      definition: "Simplified Molecular Input Line Entry System. A notation that allows a user to represent a chemical structure in a way that can be used by computers. It's a linear text format that encodes molecular structure.",
      formula: 'Example: "CCO" represents ethanol (CH3CH2OH)'
    },
    {
      icon: Ruler,
      term: "Molecular Weight",
      definition: "The sum of the atomic weights of all atoms in a molecule, measured in Daltons (Da) or g/mol. It's a key descriptor for drug-like properties, as most oral drugs have molecular weights between 180-500 Da.",
      formula: "Typical range for drug candidates: 100-750 Da"
    },
    {
      icon: Beaker,
      term: "Assay ChEMBL ID",
      definition: "A unique identifier for a biological assay in the ChEMBL database. Each assay tests compounds against specific biological targets under defined conditions.",
      formula: "Format: CHEMBL followed by numbers"
    },
    {
      icon: Dna,
      term: "Standard Relation",
      definition: "Indicates the type of measurement relationship. '=' means exact measurement, '>' means greater than, '<' means less than. Exact measurements ('=') are most reliable for modeling.",
      formula: "= (exact) | > (greater than) | < (less than)"
    },
    {
      icon: Beaker,
      term: "Standard Value",
      definition: "The normalized activity value for a compound-assay pair, typically IC50, EC50, Ki, or Kd. After unit conversion and transformation, it becomes comparable across different assays.",
      formula: "Expressed in pIC50 units after normalization"
    },
    {
      icon: Ruler,
      term: "Bioactivity Data",
      definition: "Experimental measurements of how chemical compounds interact with biological targets. This includes potency, selectivity, and efficacy measurements from high-throughput screening and detailed pharmacological studies.",
      formula: "Sources: ChEMBL, PubChem, BindingDB"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Sidebar />
      
      <main className="p-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                Technical Glossary
              </h1>
            </div>
            <p className="text-muted-foreground">
              Key terms and concepts used in bioactivity data processing
            </p>
          </div>

          <div className="grid gap-6">
            {terms.map((item, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {item.term}
                    </h2>
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      {item.definition}
                    </p>
                    <div className="bg-muted/50 rounded-md p-3 border border-border">
                      <code className="text-sm text-foreground font-mono">
                        {item.formula}
                      </code>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              About This Pipeline
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              This application processes bioactivity data in ChEMBL format through a standardized pipeline. 
              The goal is to transform raw experimental data into clean, normalized datasets suitable for 
              machine learning and cheminformatics analysis. Each step removes noise, standardizes units, 
              and applies quality filters to ensure high-quality training data for predictive models.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Glossary;
