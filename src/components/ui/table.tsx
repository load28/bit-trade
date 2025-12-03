import * as React from "react";
import {
  tableWrapper,
  table as tableStyle,
  tableHeader as tableHeaderStyle,
  tableBody as tableBodyStyle,
  tableFooter as tableFooterStyle,
  tableRowRecipe,
  tableHead as tableHeadStyle,
  tableCellRecipe,
  tableCaption as tableCaptionStyle,
  tableEmpty as tableEmptyStyle,
} from "./table.css";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className={tableWrapper}>
    <table
      ref={ref}
      className={className ? `${tableStyle} ${className}` : tableStyle}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={className ? `${tableHeaderStyle} ${className}` : tableHeaderStyle}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={className ? `${tableBodyStyle} ${className}` : tableBodyStyle}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={className ? `${tableFooterStyle} ${className}` : tableFooterStyle}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
  selected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, interactive, selected, ...props }, ref) => {
    const rowClass = tableRowRecipe({ interactive, selected });
    return (
      <tr
        ref={ref}
        className={className ? `${rowClass} ${className}` : rowClass}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align, ...props }, ref) => (
    <th
      ref={ref}
      className={className ? `${tableHeadStyle} ${className}` : tableHeadStyle}
      data-align={align}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

export interface TableCellProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  align?: "left" | "center" | "right";
  numeric?: boolean;
  profit?: boolean;
  loss?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align, numeric, profit, loss, ...props }, ref) => {
    const cellClass = tableCellRecipe({ align, numeric, profit, loss });
    return (
      <td
        ref={ref}
        className={className ? `${cellClass} ${className}` : cellClass}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={className ? `${tableCaptionStyle} ${className}` : tableCaptionStyle}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

const TableEmpty = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { colSpan?: number }
>(({ className, children, colSpan = 100, ...props }, ref) => (
  <tr>
    <td
      ref={ref}
      colSpan={colSpan}
      className={className ? `${tableEmptyStyle} ${className}` : tableEmptyStyle}
      {...props}
    >
      {children || "데이터가 없습니다"}
    </td>
  </tr>
));
TableEmpty.displayName = "TableEmpty";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
};
