import { PrintOptions } from "../PrintOptions";
import { PriceList } from "../PriceList";
import { FileUpload } from "../FileUpload";
import { ManualPageCount } from "../ManualPageCount";
import { CopiesInput } from "../CopiesInput";

interface PrintingOptionsProps {
  selectedGsm: "70" | "100";
  setSelectedGsm: (value: "70" | "100") => void;
  selectedType: "bw" | "color";
  setSelectedType: (value: "bw" | "color") => void;
  selectedSides: "single" | "double";
  setSelectedSides: (value: "single" | "double") => void;
  pageCount: number;
  setPageCount: (count: number) => void;
  copies: number;
  setCopies: (copies: number) => void;
  onFileChange: (file: File | null, uploadedUrl: string, path?: string) => void;
  isSubmitting?: boolean;
}

export const PrintingOptions = ({
  selectedGsm,
  setSelectedGsm,
  selectedType,
  setSelectedType,
  selectedSides,
  setSelectedSides,
  pageCount,
  setPageCount,
  copies,
  setCopies,
  onFileChange,
  isSubmitting = false,
}: PrintingOptionsProps) => {
  return (
    <div className="space-y-6">
      <PrintOptions
        selectedGsm={selectedGsm}
        setSelectedGsm={setSelectedGsm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedSides={selectedSides}
        setSelectedSides={setSelectedSides}
      />
      <PriceList selectedGsm={selectedGsm} />
      <FileUpload 
        onFileUpload={onFileChange} 
        isSubmitting={isSubmitting}
        pageCount={pageCount}
      />
      <ManualPageCount pageCount={pageCount} onPageCountChange={setPageCount} />
      <CopiesInput copies={copies} setCopies={setCopies} />
    </div>
  );
};