//@ts-nocheck
import React, {
  ReactNode,
  FunctionComponent,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import BaseAPI from "@/services/BaseAPI";
import { BASE_MATERIAL, HANGOUT, CLEAN_TYPE, WASTE, MOBJECT, NAME_ASSETS } from "@/common/contants";
import cloneDeep from "lodash/cloneDeep";
import { onlyUnique, sleep, sortWaste } from "@/common/functions";
import { isEmpty } from "lodash";

interface IProviderProps {
  children: ReactNode;
}

interface IContext {
  currentToken?: string;
  pets?: any[];
  energy?: number;
  totalPet?: number;
  assets?: any[];
  needMaterial?: any[];
  rarity?: any[];
  initData: () => void;
  initAssets: () => void;
  initPet: (isInit?: boolean) => void;
  initProfile: () => void;
  handleHealingPet?: (pet: any, defaultAssets: any, isAll?: boolean) => void;
}

const initialState: IContext = {
  initData: () => null,
  initAssets: () => null,
  initPet: () => null,
  initProfile: () => null,
};

const Context = createContext<IContext>({ ...initialState });

export const useHomeContext = () => useContext<IContext>(Context);

const HomeProvider: FunctionComponent<IProviderProps> = ({ children }) => {
  const [currentToken, setCurrentToken] = useState("");
  const [energy, setEnergy] = useState(0);
  const [pets, setPets] = useState([]);
  const [totalPet, setTotalPet] = useState(0);
  const [needMaterial, setNeedMaterial] = useState([]);
  const [assets, setAssets] = useState([]);
  const [favoriteFoods, setFavoriFoods] = useState([]);
  const [isInit, setIsInit] = useState(false);

  const initData = async () => {
    initProfile();
    initPet();
  };

  const initProfile = async () => {
    const profile = await BaseAPI.getData("/game-profiles", {
      gameKey: "eternal",
    });
    setEnergy(profile?.data?.stats?.energy || 0);
  };

  const initPet = async () => {
    const response = await BaseAPI.getData("/user-pets", {
      page: 1,
      perPage: 100,
    });
    const pets = response?.data || [];
    const favoriteFoods = pets?.reduce((cur: any, it: any) => {
      return [...cur, ...it.favoriteFood].filter(onlyUnique);
    }, []);
    setFavoriFoods(favoriteFoods);
    setPets(pets);
    setTotalPet(response?.collectionMetadata?.total || 0);
    return pets;
  };

  const initAssets = async () => {
    const responseAsset = await BaseAPI.getData("/user-assets", {
      page: 1,
      perPage: 100,
    });
    const assetsAllow = responseAsset?.data?.sort(
      (a, b) => b?.assetType?.length - a?.assetType?.length
    );

    const needMaterial: any = [];

    assetsAllow.forEach((asset: any) => {
      const findItem = BASE_MATERIAL.find(
        (material) => material?.code === asset?.code
      );
      if (findItem) {
        const needQuatity = findItem?.quality || 0;
        const petsNeedHeal = pets.filter(
          (it: any) => it?.stats?.stamina > 100 && it.stats?.total_mood < 700
        );
        const totalPet = petsNeedHeal.length;
        const needHavest =
          Number(needQuatity) * totalPet - Number(asset?.quantity);

        needMaterial.push({
          code: findItem.code,
          quantity: needHavest > 0 ? needHavest : 0,
        });
      }
    });

    setNeedMaterial(needMaterial);

    setTimeout(() => {
      setAssets(assetsAllow || []);
    }, 0);
  };

  const handleHealingPet =
    (petItem = null, defaultAssets = [], isAll = false) =>
    async () => {
      const listAsset = isAll ? defaultAssets : assets;
      if (listAsset.length === 0 || !petItem) return;

      let pet = cloneDeep(petItem);
      const idPet = pet.id;
      const totalMood = pet?.stats?.total_mood;
      const totalStamina = pet?.stats?.stamina;
      if (totalMood >= 700 || totalStamina <= 100) return;
      const favoriteFood = pet?.favoriteFood;
      //asset
      let foodAsset = listAsset.filter((it: any) => it?.assetType === "FOOD");

      let medicalAsset = listAsset.filter((it: any) => it?.assetType === "MEDICAL");

      const hangoutAsset = listAsset.filter(
        (it: any) => it?.assetType === "HANGOUT"
      );

      let cleanAsset = listAsset.filter((it: any) => it?.assetType === "CLEAN");

      //feed pet
      let hunger = pet?.stats?.hunger;
      while (hunger < 450) {
        console.log("🚀 ~ handleHealingPet ~ hunger:", hunger);
        let food = foodAsset.find(
          (it: any) => favoriteFood.includes(it.code) && it.quantity > 0
        );

        //pick random when favories not found
        if (isEmpty(food)) {
          food = foodAsset.find(
            (it: any) => it?.quantity > 0 && !favoriteFoods.includes(it?.code)
          );
        }

        if (food?.id) {
          const response = await BaseAPI.putData(
            `/activity/feed_pet/pet/${idPet}`,
            {
              target: "USER_ASSET",
              targetClean: "POOP",
              value: food.id,
            }
          );
          pet = cloneDeep(response.data.data);
          //update list asset
          foodAsset = foodAsset.map((it: any) => {
            if (it.id === food.id) {
              return {
                ...it,
                quantity: it.quantity - 1,
              };
            }
            return it;
          });
          //update stats
          hunger = pet?.stats?.hunger;
          await sleep(3000);
        }
      }

      console.log("Feed pet done");

      // medical pet
      let healthy = pet?.stats?.healthy;
      while (healthy < 2) {
        const medical = medicalAsset.find(
          (it: any) => it.code === `Item_000${healthy + 1}` && it.quantity > 0
        );
        if (medical?.id) {
          const response = await BaseAPI.putData(
            `/activity/heal_pet/pet/${idPet}`,
            {
              target: "USER_ASSET",
              targetClean: "POOP",
              value: medical.id,
            }
          );
          pet = cloneDeep(response.data.data);
          //update list asset
          medicalAsset = medicalAsset.map((it: any) => {
            if (it.id === medical.id) {
              return {
                ...it,
                quantity: it.quantity - 1,
              };
            }
            return it;
          });
          //update stats
          healthy = pet?.stats?.healthy;
          await sleep(3000);
        } else {
          healthy = 2;
        }
      }
      console.log("Medical pet done");

      //hangout pet
      const mood = pet?.stats?.mood;
      if (mood < 300) {
        const hangout = hangoutAsset.find((it: any) => it.quantity > 0);
        if (hangout) {
          const path = HANGOUT[hangout.code];
          const response = await BaseAPI.putData(
            `/activity/${path}/pet/${idPet}`,
            {
              target: "USER_ASSET",
              targetClean: "POOP",
              value: hangout.id,
            }
          );
          pet = cloneDeep(response.data.data);
          await sleep(1000);
        }
      }

      //clean pet
      let waste = pet?.stats?.waste;
      let count = waste?.count;
      while (count > 2) {
        const wasteFind = Object.keys(waste)
          .sort(sortWaste)
          .find((it) => WASTE.includes(it) && waste[it] > 0);

        if (wasteFind) {
          const clean = cleanAsset.find(
            (it: any) => it.code === CLEAN_TYPE[wasteFind] && it.quantity > 0
          );
          if (!clean) {
            count = 0;
          } else {
            const response = await BaseAPI.putData(
              `/activity/clean_pet/pet/${idPet}`,
              {
                target: "USER_ASSET",
                targetClean: wasteFind.toUpperCase(),
                value: clean.id,
              }
            );
            pet = cloneDeep(response.data.data);
            cleanAsset = cleanAsset.map((it: any) => {
              if (it.id === clean.id) {
                return {
                  ...it,
                  quantity: it.quantity - 1,
                };
              }
              return it;
            });
            waste = pet?.stats?.waste;
            count = waste?.count;
            await sleep(3000);
          }
        } else {
          count = 0;
        }
      }

      console.log("Clean pet done");

      if (!isAll) {
        //refresh
        initPet();
        await sleep(1000);
        initAssets();
      }

      console.log("Healing pet done");
    };

    const handleHavest =
    ({
      item,
      needQuantity = 5,
      isRefresh = true,
      isAll = false,
      defaultObjects = [],
      defaultUseMapId,
    }) =>
    async () => {
      console.log(`Havest ${NAME_ASSETS[item?.code]}`);
      let allObjects = cloneDeep(defaultObjects);
      let userMapId = defaultUseMapId;
      if (!isAll) {
        const response = await BaseAPI.getData("/user-maps/game/eternal");
        userMapId = response?.data?.id;
        allObjects = response?.data?.object;
      }
      let quantity =  0;
      const mobject = MOBJECT[item.code];
      const objects = allObjects.filter((it) => it?.code === mobject);
      while (quantity < needQuantity && objects.length > 0) {
        const userMap = objects[0]?.id;
        const havestResponse = await BaseAPI.postData(
          `/user-map-objects/${userMap}/harvest/${userMapId}`
        );
        const numberValues =
          havestResponse?.data?.data[0]?.numValues[0] || null;
        await sleep(3000);
        if (!numberValues) {
          quantity = needQuantity;
        } else {
          quantity = quantity + numberValues;
        }
        objects.shift();
      }
      if (isRefresh) {
        initAssets();
        console.log("Havest done");
      }
    };

  const value: IContext = {
    currentToken,
    energy,
    pets,
    totalPet,
    assets,
    needMaterial,
    initData,
    initAssets,
    initPet,
    initProfile,
    handleHealingPet,
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt-token");
    if (token) {
      setCurrentToken(token);
      initData();
    }
  }, []);

  useEffect(() => {
    if (pets.length > 0 && !isInit) {
      initAssets();
      setIsInit(true);
    }
  }, [pets, isInit]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default HomeProvider;
