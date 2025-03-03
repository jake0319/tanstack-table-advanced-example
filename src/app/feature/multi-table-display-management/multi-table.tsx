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
	setTableFormValue: () => void;
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

	console.log(table.getRowModel(), "rowModel");

	useImperativeHandle(ref, () => {
		return {
			getTableFormValue: () => {
				// Return the actual data items, not the row model
				return table.getRowModel().rows.map(row => row.original);
			},
		};
	});

	// 선택한 행들을 모두 맨 위로 이동시키는 함수
	const moveSelectedRowsToTop = () => {
		// 선택된 행의 인덱스를 가져와서 오름차순 정렬
		const selectedIndices = Object.keys(rowSelection)
			.map(idx => parseInt(idx))
			.sort((a, b) => a - b);

		if (selectedIndices.length === 0) {
			return; // 선택된 행이 없는 경우 이동하지 않음
		}

		// 원본 데이터의 깊은 복사 생성
		const newData = [...tableData.map(item => ({ ...item }))];

		// 선택된 행들을 담을 배열
		const selectedRows = selectedIndices.map(idx => ({ ...newData[idx] }));

		// 선택되지 않은 행들 찾기
		const unselectedRows = newData.filter((_, idx) => !selectedIndices.includes(idx));

		// 새로운 테이블 데이터 구성: 선택된 행들을 먼저 배치하고, 나머지 행들을 그 뒤에 배치
		const reorderedData = [...selectedRows, ...unselectedRows];

		// 새 선택 상태 구성 (선택된 행들은 이제 테이블 상단에 위치)
		const newRowSelection: Record<number, boolean> = {};
		selectedRows.forEach((_, idx) => {
			newRowSelection[idx] = true;
		});

		setTableData(reorderedData);
		setRowSelection(newRowSelection);
	};

	// 선택된 행들을 위로 한 번에 이동시키는 함수
	const moveSelectedRowsUp = () => {
		// 선택된 행의 인덱스를 가져와서 오름차순 정렬
		const selectedIndices = Object.keys(rowSelection)
			.map(idx => parseInt(idx))
			.sort((a, b) => a - b);

		if (selectedIndices.length === 0 || selectedIndices.includes(0)) {
			return; // 선택된 행이 없거나 첫 번째 행이 선택된 경우 이동 불가
		}

		// 새로운 배열 생성 (원본 데이터의 깊은 복사)
		const newData = [...tableData.map(item => ({ ...item }))];

		// 각 선택된 행의 직전 행이 또 다른 선택된 행인지 확인
		// 연속 선택된 그룹들을 식별
		const groups = [];
		let currentGroup = [selectedIndices[0]];

		for (let i = 1; i < selectedIndices.length; i++) {
			const current = selectedIndices[i];
			const previous = selectedIndices[i - 1];

			if (current === previous + 1) {
				// 연속된 행이면 현재 그룹에 추가
				currentGroup.push(current);
			} else {
				// 연속되지 않았으면 새 그룹 시작
				groups.push([...currentGroup]);
				currentGroup = [current];
			}
		}
		groups.push([...currentGroup]); // 마지막 그룹 추가

		// 각 그룹을 위로 이동
		const newRowSelection: Record<number, boolean> = {};

		groups.forEach(group => {
			if (group.length === 0) return;

			// 그룹의 첫 행 바로 위 인덱스
			const targetIdx = group[0] - 1;

			// 위 행 임시 저장
			const rowAbove = { ...newData[targetIdx] };

			// 그룹 이동 (한 칸씩 위로)
			for (let i = 0; i < group.length; i++) {
				const currentIdx = group[i];

				if (i === 0) {
					// 첫 행은 위 행과 교체
					newData[targetIdx] = newData[currentIdx];
					newData[currentIdx] = rowAbove;
				} else {
					// 나머지 행은 순서대로 이동 (이미 한 칸씩 위로 이동된 상태)
					newData[currentIdx - 1] = newData[currentIdx];

					// 마지막 행이면 위에서 저장한 행을 마지막 위치에 배치
					if (i === group.length - 1) {
						newData[currentIdx] = rowAbove;
					}
				}

				// 새 위치에 선택 상태 표시
				newRowSelection[currentIdx - 1] = true;
			}
		});

		setTableData(newData);
		setRowSelection(newRowSelection);
	};

	// 선택된 행들을 아래로 한 번에 이동시키는 함수
	const moveSelectedRowsDown = () => {
		// 선택된 행의 인덱스를 가져와서 내림차순 정렬
		const selectedIndices = Object.keys(rowSelection)
			.map(idx => parseInt(idx))
			.sort((a, b) => b - a);

		if (selectedIndices.length === 0 || selectedIndices.includes(tableData.length - 1)) {
			return; // 선택된 행이 없거나 마지막 행이 선택된 경우 이동 불가
		}

		// 새로운 배열 생성 (원본 데이터의 깊은 복사)
		const newData = [...tableData.map(item => ({ ...item }))];

		// 각 선택된 행의 직후 행이 또 다른 선택된 행인지 확인
		// 연속 선택된 그룹들을 식별 (내림차순으로 처리하므로 역순으로 그룹화)
		const groups = [];
		let currentGroup = [selectedIndices[0]];

		for (let i = 1; i < selectedIndices.length; i++) {
			const current = selectedIndices[i];
			const previous = selectedIndices[i - 1];

			if (current === previous - 1) {
				// 연속된 행이면 현재 그룹에 추가
				currentGroup.push(current);
			} else {
				// 연속되지 않았으면 새 그룹 시작
				groups.push([...currentGroup]);
				currentGroup = [current];
			}
		}
		groups.push([...currentGroup]); // 마지막 그룹 추가

		// 각 그룹을 아래로 이동
		const newRowSelection: Record<number, boolean> = {};

		groups.forEach(group => {
			if (group.length === 0) return;

			// 그룹의 첫 행 바로 아래 인덱스
			const targetIdx = group[0] + 1;

			// 아래 행 임시 저장
			const rowBelow = { ...newData[targetIdx] };

			// 그룹 이동 (한 칸씩 아래로)
			for (let i = 0; i < group.length; i++) {
				const currentIdx = group[i];

				if (i === 0) {
					// 첫 행은 아래 행과 교체
					newData[targetIdx] = newData[currentIdx];
					newData[currentIdx] = rowBelow;
				} else {
					// 나머지 행은 순서대로 이동 (이미 한 칸씩 아래로 이동된 상태)
					newData[currentIdx + 1] = newData[currentIdx];

					// 마지막 행이면 아래에서 저장한 행을 첫 위치에 배치
					if (i === group.length - 1) {
						newData[currentIdx] = rowBelow;
					}
				}

				// 새 위치에 선택 상태 표시
				newRowSelection[currentIdx + 1] = true;
			}
		});

		setTableData(newData);
		setRowSelection(newRowSelection);
	};
	// 선택한 행들을 모두 맨 아래로 이동시키는 함수
	const moveSelectedRowsToBottom = () => {
		// 선택된 행의 인덱스를 가져와서 오름차순 정렬
		const selectedIndices = Object.keys(rowSelection)
			.map(idx => parseInt(idx))
			.sort((a, b) => a - b);

		if (selectedIndices.length === 0) {
			return; // 선택된 행이 없는 경우 이동하지 않음
		}

		// 원본 데이터의 깊은 복사 생성
		const newData = [...tableData.map(item => ({ ...item }))];

		// 선택된 행들을 담을 배열
		const selectedRows = selectedIndices.map(idx => ({ ...newData[idx] }));

		// 선택되지 않은 행들 찾기
		const unselectedRows = newData.filter((_, idx) => !selectedIndices.includes(idx));

		// 새로운 테이블 데이터 구성: 선택되지 않은 행들을 먼저 배치하고, 선택된 행들을 그 뒤에 배치
		const reorderedData = [...unselectedRows, ...selectedRows];

		// 새 선택 상태 구성 (선택된 행들은 이제 테이블 하단에 위치)
		const newRowSelection: Record<number, boolean> = {};
		selectedRows.forEach((_, idx) => {
			const newIndex = unselectedRows.length + idx;
			newRowSelection[newIndex] = true;
		});

		setTableData(reorderedData);
		setRowSelection(newRowSelection);
	};

	// 선택한 행 삭제 (내장 함수 활용)
	const deleteSelectedRows = () => {
		// getSelectedRowModel()을 사용하여 선택된 모든
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
				<Button onClick={moveSelectedRowsToTop}>전부위로</Button>

				<Button onClick={moveSelectedRowsDown}>
					<ChevronDown />
				</Button>
				<Button onClick={moveSelectedRowsUp}>
					<ChevronUp />
				</Button>
				<Button onClick={moveSelectedRowsToBottom}>전부아래로</Button>
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

// 메모이제이션된 컴포넌트 내보내기

export default React.memo(MultiTable);
