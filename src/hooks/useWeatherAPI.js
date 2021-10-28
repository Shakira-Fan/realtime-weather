import { useState, useEffect, useCallback } from "react";

const fetchCurrentWeather = ({ locationName, authorizationKey }) => {
    //留意這裡加上return 直接把fetch API回傳的Promise再回傳出去
    return fetch(
        `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${authorizationKey}&locationName=${locationName}`
    )
        .then((response) => response.json())
        .then((data) => {
            //STEP 1:定義`locationData`把回傳的資料終會用到的部分抽取出來
            const locationData = data.records.location[0];

            //STEP 2:將風速(WDSD)和氣溫(TEMP)的資料取出
            const weatherElements = locationData.weatherElement.reduce(
                (neededElements, item) => {
                    if (['WDSD', 'TEMP'].includes(item.elementName)) {
                        neededElements[item.elementName] = item.elementValue;
                    }
                    return neededElements;
                },
                {}
            );

            //STEP 3:要使用到React組件中的資料
            //把取得的資料內容回傳出去，而不是在這裡setWeatherElement
            return {
                locationName: locationData.locationName,
                windSpeed: weatherElements.WDSD,
                temperature: weatherElements.TEMP,
                observationTime: locationData.time.obsTime,
                isLoading: false,
            };

        });
};

const fetchWeatherForecast = ({ cityName, authorizationKey }) => {
    return fetch(
        `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${authorizationKey}&locationName=${cityName}`
    )
        .then((response) => response.json())
        .then((data) => {
            //STEP 1:取出某縣市的預報資料
            const locationData = data.records.location[0];

            //STEP 2:將天氣現象、降雨機率、舒適度的資料取出
            const weatherElements = locationData.weatherElement.reduce(
                (neededElements, item) => {
                    if (['Wx', 'PoP', 'CI'].includes(item.elementName)) {
                        neededElements[item.elementName] = item.time[0].parameter;
                    }
                    return neededElements;
                },
                {}
            );

            //STEP 3:要使用到React組件中的資料
            //把取得的資料內容回傳出去，而不是在這裡setWeatherElement
            return {
                description: weatherElements.Wx.parameterName,
                weatherCode: weatherElements.Wx.parameterValue,
                rainPossibility: weatherElements.PoP.parameterName,
                comfortabiliy: weatherElements.CI.parameterName,
            };
        });
};

const useWeatherAPI = ({ locationName, cityName, authorizationKey }) => {
    const [weatherElement, setWeatherElement] = useState({
        locationName: '',
        description: '',
        windSpeed: 0,
        temperature: 0,
        rainPossibility: 0,
        observationTime: new Date(),
        comfortabiliy: '',
        weatherCode: 0,
        isLoading: true,
    });

    const fetchData = useCallback(async () => {

        setWeatherElement((prevState) => ({
            ...prevState,
            isLoading: true,
        }));

        //直接透過陣列的解構賦值來取出Promise.all回傳的值
        const [currentWeather, weatherForecast] = await Promise.all([fetchCurrentWeather({ locationName, authorizationKey }), fetchWeatherForecast({ cityName, authorizationKey })]);
        setWeatherElement({
            ...currentWeather,
            ...weatherForecast,
            isLoading: false,
        });
    }, [locationName, cityName, authorizationKey]);

    useEffect(() => {
        console.log('execute function in useEffect');
        fetchData();
    }, [fetchData]);

    return [weatherElement, fetchData];
};

export default useWeatherAPI;