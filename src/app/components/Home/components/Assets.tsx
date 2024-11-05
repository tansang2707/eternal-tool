//@ts-nocheck
import React, { useState } from "react";
import { useHomeContext } from "../provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReloadIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { NAME_ASSETS } from "@/common/contants";

const HeadTitles = ["Name", "Type", "Quantity", "Actions"];

const Asset = ({ data }: { data: any }) => {
  const { needMaterial, handleHavest } = useHomeContext();
  const material = needMaterial.find((item) => item?.code === data?.code);
  const [isLoading, setIsLoading] = useState(false);

  const isResource = data?.assetType === "RESOURCE";

  const isNeed = material && material?.quantity > 0;

  const handleHavestItem = async () => {
    setIsLoading(true);
    console.log(data);
    await handleHavest({
      item: data,
      needQuantity: 10,
      isRefresh: true,
      isAll: false,
      defaultObjects: [],
      defaultUseMapId: "",
    })();
    setIsLoading(false);
  };

  return (
    <TableRow>
      <TableCell
        className={`font-medium flex items-center ${
          isNeed ? "text-destructive" : ""
        }`}
      >
        {NAME_ASSETS[data?.code] || data?.code}
        {isNeed && <InfoCircledIcon className="ml-2" />}
      </TableCell>
      <TableCell>{data?.assetType}</TableCell>
      <TableCell>{data?.quantity}</TableCell>
      <TableCell className="text-right">
        {isResource ? (
          <Button onClick={handleHavestItem} disabled={isLoading}>
            {isLoading ? (
              <>
                <ReloadIcon className="h-4 w-4 animate-spin" />
              </>
            ) : (
              "Havest 10 quantity"
            )}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

const Assets = () => {
  const { assets } = useHomeContext();

  const renderTableHead = () => {
    return HeadTitles.map((it: string) => (
      <TableHead className="first:w-[200px] last:text-right" key={it}>
        {it}
      </TableHead>
    ));
  };

  const renderTableCell = () => {
    if (assets?.length === 0) return;
    const allowedItem = Object.keys(NAME_ASSETS);
    return assets
      ?.filter((it) => allowedItem.includes(it?.code))
      ?.map((it) => {
        return <Asset key={it?.id} data={it} />;
      });
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>{renderTableHead()}</TableRow>
        </TableHeader>
        <TableBody>{renderTableCell()}</TableBody>
      </Table>
    </div>
  );
};

export default Assets;
