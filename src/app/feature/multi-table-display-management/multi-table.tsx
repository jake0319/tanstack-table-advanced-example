"use client";

import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImperativeHandle, useState } from "react";
import { useFormContext } from "react-hook-form";
import { makeDisplayData } from "./make-fake.data";

// 체크박스 checkStatus
// No. NO.
// 상품번호 productNo
// 상품명  productName
// 파트너사 partnerName
// 판매상태 saleStatus
// 정상가 normalPrice
// 판매가 saleprice
// 재고 수령 stockCnt
interface Display {
	productNo: number;
	productName: string;
	partnerName: string;
	saleStatus: "Y" | "N";
	normalPrice: number;
	salePrice: number;
	stockCnt: number;
}

const columnHelper = createColumnHelper<Display>();

export const columns = [
	columnHelper.display({
		id: "select",
		header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
		cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />,
	}),
	columnHelper.display({
		id: "No",
		header: info => info.header.id,
		cell: ({ row }) => <div>{row.index + 1}</div>,
	}),
	columnHelper.accessor(row => row.productNo, {
		id: "productNo",
		header: "상품번호",
	}),
	columnHelper.accessor(row => row.productName, {
		id: "productName",
		header: "상품명",
	}),
	columnHelper.accessor(row => row.partnerName, {
		id: "partnerName",
		header: "파트너사",
	}),
	columnHelper.accessor(row => row.saleStatus, {
		id: "saleStatus",
		header: "판매상태",
	}),
	columnHelper.accessor(row => row.normalPrice, {
		id: "normalPrice",
		header: "정상가",
	}),
	columnHelper.accessor(row => row.salePrice, {
		id: "salePrice",
		header: "판매가",
	}),
	columnHelper.accessor(row => row.stockCnt, {
		id: "stockCnt",
		header: "재고수량",
	}),
];
interface MultiTableRef {
	getTableFormValue: () => Display[];
}
interface MultiTableProps {
	tableId: number;
}

const MultiTable = React.forwardRef<MultiTableRef, MultiTableProps>(({ tableId }, ref) => {
	const [rowSelection, setRowSelection] = useState({});
	const [tableData, setTableData] = useState<Display[]>([]);
	const { setValue } = useFormContext();
	console.log(tableId, "tableId is running");

	const addTableData = () => setTableData(makeDisplayData(100));

	const table = useReactTable({
		data: tableData,
		columns,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			rowSelection,
		},
	});

	useImperativeHandle(ref, () => {
		return {
			getTableFormValue: () => table.getRowModel().rows.map(row => row.original),
		};
	});

	const moveSelectedRowsToTopOrBottom = (direction: "Top" | "Bottom") => {
		// 선택된 행의 인덱스 가져오기
		const selectedIndices = Object.keys(rowSelection).map(idx => parseInt(idx));
		if (selectedIndices.length === 0) return;

		// 원본 데이터 복사
		const newData = [...tableData.map(item => ({ ...item }))];

		// 선택된 행들의 데이터 추출
		const selectedRows = selectedIndices.map(idx => newData[idx]);

		// 선택되지 않은 행들의 데이터 추출
		const unselectedRows = newData.filter((_, idx) => !selectedIndices.includes(idx));

		// 선택된 행들을 맨 앞으로, 나머지는 그 뒤에 배치
		const reorderedData = direction === "Top" ? [...selectedRows, ...unselectedRows] : [...unselectedRows, ...selectedRows];

		// 새로운 선택 상태 생성
		const newRowSelection: { [key in number]: boolean } = {};

		if (direction === "Top") {
			// 맨 위로 이동: 인덱스 0부터 선택된 행 수만큼
			selectedRows.forEach((_, idx) => {
				newRowSelection[idx] = true;
			});
		} else {
			// 맨 아래로 이동: 비선택 행 수부터 끝까지
			const startIdx = unselectedRows.length;
			selectedRows.forEach((_, idx) => {
				newRowSelection[startIdx + idx] = true;
			});
		}
		setTableData(reorderedData);
		setRowSelection(newRowSelection);
	};

	// 선택된 행들을 위로 한칸 동시에 이동시키는 함수
	const moveSelectedRowsUp = () => {
		const selectedIndices = Object.keys(rowSelection).map(idx => parseInt(idx));
		if (selectedIndices.length === 0 || selectedIndices.includes(0)) return;

		const newData = [...tableData.map(item => ({ ...item }))];
		const newRowSelection: Record<number, boolean> = {};

		for (const idx of selectedIndices) {
			const temp = newData[idx];
			newData[idx] = newData[idx - 1];
			newData[idx - 1] = temp;

			newRowSelection[idx - 1] = true;
		}

		setTableData(newData);
		setRowSelection(newRowSelection);
	};

	const moveSelectedRowsDown = () => {
		const selectedIndices = Object.keys(rowSelection).map(idx => parseInt(idx));
		if (selectedIndices.length === 0 || selectedIndices.includes(tableData.length - 1)) return;

		// 새로운 배열 생성 (원본 데이터의 깊은 복사)
		const newData = [...tableData.map(item => ({ ...item }))];
		const newRowSelection: Record<number, boolean> = {};

		for (const idx of selectedIndices) {
			// 현재 행과 아래 행 교체
			const temp = newData[idx];
			newData[idx] = newData[idx + 1];
			newData[idx + 1] = temp;

			// 새 위치에 선택 상태 표시
			newRowSelection[idx + 1] = true;
		}

		setTableData(newData);
		setRowSelection(newRowSelection);
	};

	const deleteSelectedRows = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		const selectedIndices = selectedRows.map(row => row.index);

		// 선택되지 않은 행만 필터링하여 새 데이터 배열 생성
		const newData = tableData.filter((_, idx) => !selectedIndices.includes(idx));

		// 데이터 업데이트
		setTableData(newData);

		// 선택 상태 초기화
		table.resetRowSelection();
	};

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				<Button onClick={addTableData}>상품추가 </Button>
				<Button onClick={deleteSelectedRows}>상품제외 </Button>
				<Button onClick={() => moveSelectedRowsToTopOrBottom("Top")}>전부위로</Button>

				<Button onClick={moveSelectedRowsDown}>
					<ChevronDown />
				</Button>
				<Button onClick={moveSelectedRowsUp}>
					<ChevronUp />
				</Button>
				<Button onClick={() => moveSelectedRowsToTopOrBottom("Bottom")}>전부아래로</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							Columns <ChevronDown />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter(column => column.getCanHide())
							.map(column => {
								return (
									<DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={value => column.toggleVisibility(!!value)}>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => {
									return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>;
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
});

export default React.memo(MultiTable);
