import React, { ChangeEvent, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useHomeContext } from "../provider";
import { sleep } from "@/common/functions";
import Pets from "./Pets";
import Assets from "./Assets";
import BaseAPI from "@/services/BaseAPI";

const Home = () => {
  const { currentToken, energy, pets, initData, initProfile } = useHomeContext();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeToken = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setToken(value);
  };

  const handleAddToken = async () => {
    setIsLoading(true);
    if (token) {
      localStorage.setItem("jwt-token", token);
      setToken("");
      await sleep(1000);
      initData();
    }
    setIsLoading(false);
  };

  const handleClaimEnergy = async () => {
    try {
      await BaseAPI.postData("/activity/claim/energy?gameKey=eternal");
      //refresh
      initProfile();
    } catch (error) {
      console.log("🚀 ~ handleClaimEnergy ~ error:", error);
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex w-full max-w-sm items-center space-x-2 mx-auto">
        <Input
          placeholder="JWT Token"
          value={token}
          onChange={handleChangeToken}
        />
        <Button onClick={handleAddToken} disabled={!token || isLoading}>
          Submit
        </Button>
      </div>
      {currentToken && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <span>Energy: {energy}</span>
            <span>Total: {pets?.length}</span>
            <Button onClick={handleClaimEnergy}>Claim Energy</Button>
          </div>
          <Tabs defaultValue="pets" className="w-full mt-8">
            <TabsList className="mx-auto">
              <TabsTrigger value="pets">Pets</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>
            <TabsContent value="pets">
              <Pets />
            </TabsContent>
            <TabsContent value="assets">
              <Assets />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Home;
