import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FileText, AlertCircle, Search } from "lucide-react";

interface CsvPreviewProps {
  filename: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  previewRows?: number;
}

export const CsvPreview = ({ 
  filename, 
  headers, 
  rows, 
  totalRows,
  previewRows = 5 
}: CsvPreviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = rows.filter(row => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return row.some(cell => 
      cell?.toString().toLowerCase().includes(searchLower)
    );
  });

  const displayRows = filteredRows.slice(0, previewRows);

  return (
    <Card className="p-6">
      <div className="space-y-4 mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {filename}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? (
                <>Showing {displayRows.length} of {filteredRows.length} filtered rows (from {totalRows} total) • {headers.length} columns</>
              ) : (
                <>Showing {displayRows.length} of {totalRows} rows • {headers.length} columns</>
              )}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {headers.length === 0 || rows.length === 0 ? (
        <div className="flex items-center gap-2 p-8 border border-border rounded-lg bg-muted/20">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No data to preview. File may be empty or invalid.
          </p>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-lg border border-border">
          <div className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {headers.slice(0, 50).map((header, index) => (
                    <TableHead key={index} className="font-semibold text-foreground whitespace-nowrap min-w-[150px]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.slice(0, 50).map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap min-w-[150px]">
                        {cell || <span className="text-muted-foreground italic">empty</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {filteredRows.length > previewRows && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          + {filteredRows.length - previewRows} more {searchTerm ? "filtered" : ""} rows not shown
        </p>
      )}
      
      {searchTerm && filteredRows.length === 0 && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          No rows match your search
        </p>
      )}
    </Card>
  );
};
