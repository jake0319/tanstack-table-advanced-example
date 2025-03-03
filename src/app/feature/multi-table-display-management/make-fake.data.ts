import { faker } from "@faker-js/faker";

interface Display {
	productNo: number;
	productName: string;
	partnerName: string;
	saleStatus: "Y" | "N";
	normalPrice: number;
	salePrice: number;
	stockCnt: number;
}

const range = (len: number) => {
	const arr: number[] = [];
	for (let i = 0; i < len; i++) {
		arr.push(i);
	}
	return arr;
};

const newDisplay = (): Display => {
	return {
		productNo: faker.number.int(100),
		productName: faker.commerce.productName(),
		partnerName: "임시파트너사",
		saleStatus: faker.helpers.shuffle<Display["saleStatus"]>(["Y", "N"])[0]!,
		normalPrice: Number(faker.commerce.price()),
		salePrice: Number(faker.commerce.price()),
		stockCnt: faker.number.int(2),
	};
};

export function makeDisplayData(len: number) {
	return range(len).map((d): Display => {
		return {
			...newDisplay(),
		};
	});
}
