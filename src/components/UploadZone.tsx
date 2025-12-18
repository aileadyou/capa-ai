import { Upload } from "lucide-react";

export const UploadZone = () => {
  return (
    <div className="group relative rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-8 transition-all duration-300 hover:border-primary hover:shadow-md hover:scale-[1.02] cursor-pointer animate-fade-in">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-glow transition-all duration-300 group-hover:scale-110">
            <Upload className="h-6 w-6 text-white transition-transform duration-300 group-hover:-translate-y-1" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base leading-5 text-foreground font-medium">
              Drag your file(s) or
            </span>
            <span className="text-base font-bold leading-5 text-primary transition-colors duration-300 group-hover:text-primary-dark">
              browse
            </span>
          </div>
          <p className="text-center text-sm leading-5 text-muted-foreground">
            Max 10 MB files are allowed
          </p>
        </div>
      </div>
    </div>
  );
};
