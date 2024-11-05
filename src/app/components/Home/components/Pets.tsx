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
import { sleep, upperCaseFirstLetter } from "@/common/functions";
import { ReloadIcon } from "@radix-ui/react-icons";
import BaseAPI from "@/services/BaseAPI";

const HeadTitles = ["Type", "Rarity", "Mood", "Stamina", "Actions"];

const Pet = ({ data, isPending }: { data: any; isPending: boolean }) => {
  const { handleHealingPet } = useHomeContext();
  const [isLoading, setIsLoading] = useState(false);
  const handleHeal = async () => {
    setIsLoading(true);
    await handleHealingPet(data)();
    setIsLoading(false);
  };
  return (
    <TableRow>
      <TableCell className="font-medium">{data?.type} {data?.tokenId}</TableCell>
      <TableCell>{upperCaseFirstLetter(data?.rarityCode)}</TableCell>
      <TableCell>{data?.stats?.total_mood}</TableCell>
      <TableCell>{data?.stats?.stamina}</TableCell>
      <TableCell className="text-right">
        <Button onClick={handleHeal} disabled={isLoading || isPending}>
          {isLoading || isPending ? (
            <>
              <ReloadIcon className="h-4 w-4 animate-spin" />
            </>
          ) : (
            "Heal"
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const Pets = () => {
  const { pets, handleHealingPet, initPet, initAssets } = useHomeContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleHealAll = async () => {
    try {
      setIsLoading(true);
      const filtedPets = pets.filter((it: any) => it?.type !== "LEGEND");
      for (const item of filtedPets) {
        const responseAsset = await BaseAPI.getData("/user-assets", {
          page: 1,
          perPage: 100,
        });
        const assetsAllow = responseAsset?.data?.sort(
          (a: any, b: any) => b?.assetType?.length - a?.assetType?.length
        );
        await sleep(500);
        if (handleHealingPet) {
          await handleHealingPet(item, assetsAllow, true)();
        }
        console.log(`Healing done for ${item?.id}`);
        await sleep(2000);
      }
      initPet();
      await sleep(1000);
      initAssets();
      console.log(`Healing all pet done`);
    } catch (error) {
      console.log("🚀 ~ handleHealAll ~ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableHead = () => {
    return HeadTitles.map((it: string) => (
      <TableHead className="first:w-[100px] last:text-right" key={it}>
        {it}
      </TableHead>
    ));
  };

  const renderTableCell = () => {
    if (pets?.length === 0) return;
    return pets?.sort((a, b) => b?.stats?.stamina - a?.stats?.stamina)?.map((it) => {
      return <Pet key={it?.id} data={it} isPending={isLoading} />;
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button className="" onClick={handleHealAll}>
          Heal all
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>{renderTableHead()}</TableRow>
        </TableHeader>
        <TableBody>{renderTableCell()}</TableBody>
      </Table>
    </div>
  );
};

export default Pets;
