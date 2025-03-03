"use client";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import MultiTable from "./feature/multi-table-display-management/multi-table";

interface Display {
	productNo: number;
	productName: string;
	partnerName: string;
	saleStatus: "Y" | "N";
	normalPrice: number;
	salePrice: number;
	stockCnt: number;
}

interface MultiTableRef {
	getTableFormValue: () => Display[];
}

export default function App() {
	const [tableIds, setTableIds] = useState([0]);
	const tablesRef = useRef<Record<number, MultiTableRef | null>>({});
	const methods = useForm();

	// 테이블 추가
	const addNewTable = () => {
		// 빈 배열일 경우 Math.max가 -Infinity 반환
		const newId = tableIds.length > 0 ? Math.max(...tableIds) + 1 : 0;
		setTableIds([...tableIds, newId]);
	};

	// 특정 테이블을 한 칸 위로 이동시키는 함수
	const moveTableUp = (tableId: number) => {
		setTableIds(prevList => {
			const tableIdx = prevList.indexOf(tableId);
			if (tableIdx <= 0 || tableIdx === -1) return prevList;

			const newList = [...prevList];
			[newList[tableIdx], newList[tableIdx - 1]] = [newList[tableIdx - 1], newList[tableIdx]];

			return newList;
		});
	};

	// 특정 테이블을 한 칸 아래로 이동시키는 함수
	const moveTableDown = (tableId: number) => {
		setTableIds(prevList => {
			const tableIdx = prevList.indexOf(tableId);
			if (tableIdx === -1 || tableIdx >= prevList.length - 1) return prevList;

			const newList = [...prevList];
			[newList[tableIdx], newList[tableIdx + 1]] = [newList[tableIdx + 1], newList[tableIdx]];

			return newList;
		});
	};

	// 테이블삭제 (TODO)
	const removeTable = (tableId: number) => {
		setTableIds(prevList => prevList.filter(id => id !== tableId));
		// tablesRef에서도 해당 참조 제거
		delete tablesRef.current[tableId];
	};

	// 모든 테이블 값 폼에 저장하기
	const setAllTableValues = () => {
		const tableDataArray = tableIds.map(id => tablesRef.current[id]?.getTableFormValue()).filter(data => data !== undefined);

		methods.setValue("tableDataArray", tableDataArray);
		console.log(methods.getValues());
		console.log("모든 테이블이 폼에 저장됨");
	};

	return (
		<div>
			<Button onClick={setAllTableValues}>테이블데이터폼 세팅하기</Button>
			<Button onClick={addNewTable}>테이블추가</Button>

			<FormProvider {...methods}>
				{tableIds.map(tableId => (
					<div key={"TableNo-" + tableId}>
						<div className="flex">
							<b>tableNo:{tableId}</b>
							<Button onClick={() => moveTableUp(tableId)}>업</Button>
							<Button onClick={() => moveTableDown(tableId)}>다운</Button>
							<div>진열탭명</div>
						</div>

						<MultiTable
							tableId={tableId}
							ref={el => {
								// 콜백 ref를 사용하여 테이블 참조 저장
								tablesRef.current[tableId] = el;
							}}
						/>
					</div>
				))}
			</FormProvider>
		</div>
	);
}
