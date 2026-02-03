import { z } from "zod";

// ============================================================================
// 1. EPISTEMIC & SEMANTIC TYPES
// ============================================================================

export enum SemanticType {
  Quantitative = "QUANTITATIVE", // Continuous numbers (Sales, Temperature)
  Ordinal = "ORDINAL", // Ranked data (Low, Medium, High)
  Nominal = "NOMINAL", // Categories (Region, Product Type)
  Temporal = "TEMPORAL", // Dates and Times
  Identifier = "IDENTIFIER", // Unique IDs (Transaction ID)
  Unknown = "UNKNOWN",
}

export interface EpistemicState {
  reliability: number; // 0.0 to 1.0 (1.0 = Ground Truth)
  missingness: number; // 0.0 to 1.0 (percentage of missing values)
  source?: string;
  assumptions: string[]; // List of assumptions made during ingestion (e.g., "Coerced strings to numbers")
}

export type Primitive = number | string | Date | boolean | null | undefined;

// ============================================================================
// 2. COLUMN ABSTRACTION
// ============================================================================

export class SemanticColumn {
  public readonly id: string;
  public readonly name: string;
  public readonly type: SemanticType;
  public readonly epistemic: EpistemicState;
  private data: Primitive[];

  constructor(
    name: string,
    data: Primitive[],
    type: SemanticType = SemanticType.Unknown,
    epistemic?: Partial<EpistemicState>
  ) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.data = data;
    this.type = type === SemanticType.Unknown ? this.inferType(data) : type;

    // Calculate missingness automatically
    const missingCount = data.filter((v) => v === null || v === undefined || v === "").length;

    this.epistemic = {
      reliability: epistemic?.reliability ?? 1.0, // Assume reliable unless stated otherwise
      missingness: missingCount / data.length,
      source: epistemic?.source,
      assumptions: epistemic?.assumptions ?? [],
    };
  }

  // Immutable access
  public get values(): Primitive[] {
    return this.data;
  }

  public get length(): number {
    return this.data.length;
  }

  /**
   * Naive type inference. In a real system, this would be more robust.
   */
  private inferType(data: Primitive[]): SemanticType {
    const nonNull = data.filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.length === 0) return SemanticType.Unknown;

    const sample = nonNull.slice(0, 100);

    // Check for Dates
    const isDate = sample.every((v) => v instanceof Date || !isNaN(Date.parse(String(v))));
    if (isDate && sample.some(v => typeof v !== 'number')) return SemanticType.Temporal;

    // Check for Numbers
    const isNumber = sample.every((v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== ""));
    if (isNumber) return SemanticType.Quantitative;

    // Check for Boolean-ish
    const isBool = sample.every((v) => v === true || v === false || v === "true" || v === "false");
    if (isBool) return SemanticType.Nominal;

    // Default to Nominal or Identifier based on uniqueness
    const uniqueRatio = new Set(sample).size / sample.length;
    if (uniqueRatio > 0.9 && sample.length > 50) return SemanticType.Identifier;

    return SemanticType.Nominal;
  }
}

// ============================================================================
// 3. DATAFRAME ABSTRACTION
// ============================================================================

export class DataFrame {
  public readonly id: string;
  private columns: Map<string, SemanticColumn>;
  private rowCount: number;

  constructor(columns: SemanticColumn[]) {
    this.id = crypto.randomUUID();
    this.columns = new Map();
    this.rowCount = columns.length > 0 ? columns[0].length : 0;

    for (const col of columns) {
      if (col.length !== this.rowCount) {
        throw new Error(`Column length mismatch: ${col.name} has ${col.length}, expected ${this.rowCount}`);
      }
      this.columns.set(col.name, col);
    }
  }

  /**
   * Ingest raw JSON objects into a structured DataFrame.
   */
  public static fromObjects(data: Record<string, any>[]): DataFrame {
    if (data.length === 0) return new DataFrame([]);

    const keys = Object.keys(data[0]);
    const columns = keys.map((key) => {
      const values = data.map((row) => row[key]);
      return new SemanticColumn(key, values);
    });

    return new DataFrame(columns);
  }

  public getColumn(name: string): SemanticColumn | undefined {
    return this.columns.get(name);
  }

  public getColumnNames(): string[] {
    return Array.from(this.columns.keys());
  }

  public getColumns(): SemanticColumn[] {
    return Array.from(this.columns.values());
  }

  public get dimensions(): { rows: number; cols: number } {
    return { rows: this.rowCount, cols: this.columns.size };
  }
}
