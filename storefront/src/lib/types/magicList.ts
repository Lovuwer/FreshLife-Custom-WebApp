export interface MagicListItem {
  extracted_name: string;
  quantity: string | null;
  unit: string | null;
  matched_item: {
    item_code: string;
    item_name: string;
    rate: number;
    image: string | null;
    in_stock: boolean;
  } | null;
  alternatives: { item_code: string; item_name: string; rate: number }[];
  match_status: 'Matched' | 'Partial' | 'Unmatched';
}

export interface MagicListResult {
  session_id: string;
  extracted_items: MagicListItem[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
  };
}
