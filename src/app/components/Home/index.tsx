import React from "react";
import Provider from "./provider";
import Main from "./components/Main";

const HomeScreen = () => {
  return (
    <Provider>
      <Main />
    </Provider>
  );
};

export default HomeScreen;
