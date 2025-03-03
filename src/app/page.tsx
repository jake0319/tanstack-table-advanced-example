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
	setTableFormValue: () => void;
}

export default function App() {
	const [tableIds, setTableIds] = useState([0]);
	const tablesRef = useRef<Record<number, MultiTableRef | null>>({});
	const methods = useForm();

	// 테이블 추가
	const addTable = () => {
		const newId = Math.max(...tableIds) + 1;
		setTableIds([...tableIds, newId]);
	};

	// 특정 테이블을 한 칸 위로 이동시키는 함수
	const moveTableUp = (tableId: number) => {
		setTableIds(prevList => {
			// 해당 테이블의 인덱스 찾기
			const index = prevList.indexOf(tableId);

			// 이미 맨 위에 있거나 존재하지 않는 경우 이동할 수 없음
			if (index <= 0) return prevList;

			// 새 배열을 만들어 요소 위치 변경
			const newList = [...prevList];
			// 현재 테이블과 바로 위 테이블의 위치 교환
			[newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];

			return newList;
		});
	};

	// 특정 테이블을 한 칸 아래로 이동시키는 함수
	const moveTableDown = (tableId: number) => {
		setTableIds(prevList => {
			// 해당 테이블의 인덱스 찾기
			const index = prevList.indexOf(tableId);

			// 이미 맨 아래에 있거나 존재하지 않는 경우 이동할 수 없음
			if (index === -1 || index >= prevList.length - 1) return prevList;

			// 새 배열을 만들어 요소 위치 변경
			const newList = [...prevList];
			// 현재 테이블과 바로 아래 테이블의 위치 교환
			[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];

			return newList;
		});
	};

	// 모든 테이블 값 폼에 저장하기
	const setAllTableValues = () => {
		const tableDataArray = tableIds.map(id => {
			if (tablesRef.current[id]) {
				return tablesRef.current[id]?.getTableFormValue?.();
			}
			return;
		});
		methods.setValue("tableDataArray", tableDataArray);
		console.log(methods.getValues());
		console.log("모든 테이블이 폼에 저장됨");
	};

	return (
		<div>
			<Button onClick={setAllTableValues}>테이블데이터폼 세팅하기</Button>
			<Button onClick={addTable}>테이블추가</Button>

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
