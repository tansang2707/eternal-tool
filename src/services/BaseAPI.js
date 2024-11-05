import axios from "axios";
import QueryString from "query-string";
import get from "lodash/get";

const REQUEST_TYPE = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
};

export const CancelToken = axios.CancelToken;

export default class BaseAPI {
  static async getData(type, queryBody, linkServer, isRes, options) {
    const res = await this.postGateWay(
      type,
      REQUEST_TYPE.GET,
      undefined,
      queryBody,
      linkServer,
      options
    );
    if (isRes) return get(res, "data");
    if (get(res, "data.errMessage")) {
      return res.data.errMessage;
    }
    if (get(res, "data.status") === 200) {
      return res.data;
    }
  }

  static async postData(type, body, linkServer, options, headerCaptcha) {
    return this.postGateWay(
      type,
      REQUEST_TYPE.POST,
      body,
      false,
      linkServer,
      options,
      headerCaptcha
    );
  }

  static async putData(type, body, linkServer, headerCaptcha) {
    return this.postGateWay(
      type,
      REQUEST_TYPE.PUT,
      body,
      false,
      linkServer,
      {},
      headerCaptcha
    );
  }

  static async deleteData(type, queryBody) {
    return this.postGateWay(type, REQUEST_TYPE.DELETE, undefined, queryBody);
  }

  static async postGateWay(
    action,
    method = REQUEST_TYPE.GET,
    body = {},
    queryBody,
    linkServer,
    options = {}
  ) {
    try {
      const serverUrl = linkServer || process.env.NEXT_PUBLIC_API;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwt-token") : "";
      const config = {
        timeout: 15000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          os: "website",
          osVersion: "website",
        },
        ...options,
      };

      let queryStr = "";
      if (queryBody) {
        const queryFly = QueryString.stringify(queryBody);
        queryStr = "?" + queryFly;
      }

      const axiosInstance = axios.create(config);

      const response = await axiosInstance[method](
        serverUrl + action + queryStr,
        body,
        config
      );
      return response;
    } catch (error) {
      const { response } = error;

      if (get(response, "data.data.errMess") || get(response, "data.errMess")) {
        return response;
      }
      return error;
    }
  }
}
