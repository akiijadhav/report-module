export class ProductDetail {
  product: {
    code: string;
    name: string;
  };
  productLots: ProductLotDetail[];
}

export class ProductLotDetail {
  lotNo: string;
  expiryDate: string;
  id: string;
}
