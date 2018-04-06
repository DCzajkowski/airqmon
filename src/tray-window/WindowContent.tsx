import * as React from 'react';
import { ipcRenderer } from 'electron';

import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import UpdateAlert from './UpdateAlert';
import StationInfo from './StationInfo';
import AirQualityInfo from './air-quality/AirQualityInfo';
import { AirlyAPIStatus, IAirlyCurrentMeasurement, IArilyNearestSensorMeasurement } from '../airly';
import MeasurementPane from './measurement/MeasurementPane';
import IPC_EVENTS from '../ipc-events';

interface IWindowContentProps {
  availableAppUpdate?: { version: string; url: string };
  currentMeasurements?: IAirlyCurrentMeasurement;
  nearestStation?: IArilyNearestSensorMeasurement;
  airlyApiStatus?: AirlyAPIStatus;
  geolocationError?: PositionError;
  connectionStatus: boolean;
}

class WindowContent extends React.Component<IWindowContentProps> {
  constructor(props: IWindowContentProps) {
    super(props);
  }

  handleExtLinkClick(url: string, event: MouseEvent) {
    event.preventDefault();
    ipcRenderer.send(IPC_EVENTS.OPEN_BROWSER_FOR_URL, url);
  }

  render() {
    if (this.props.connectionStatus === false) {
      return (
        <ErrorMessage header="There is no Internet connection">
          <>Your computer is offline.</>
        </ErrorMessage>
      );
    }

    if (this.props.geolocationError) {
      const error = this.props.geolocationError;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return (
            <ErrorMessage header="Location services unavailable">
              <>
                The acquisition of the geolocation information failed because the application didn't
                have the permission to do it or the Location Services are disabled. Please allow
                Airqmon to use Location Services in the Security & Privacy macOS preferences and
                then restart the application.
              </>
            </ErrorMessage>
          );
        case error.POSITION_UNAVAILABLE:
          return (
            <ErrorMessage header="Position unavailable">
              <>
                The acquisition of the geolocation failed because at least one internal source of
                position returned an internal error.
              </>
            </ErrorMessage>
          );
      }
    }

    if (this.props.airlyApiStatus !== AirlyAPIStatus.OK) {
      switch (this.props.airlyApiStatus) {
        case AirlyAPIStatus.RATE_LIMIT_EXCEEDED:
          return (
            <ErrorMessage header="Request limit reached">
              <>
                Unfortunately Airqmon exceeded the daily limit of how many times it can download
                sensor readings from Airly. You can either wait until tomorrow or provide your own
                credentials in application preferences.
              </>
            </ErrorMessage>
          );
        case AirlyAPIStatus.WRONG_TOKEN:
          return (
            <ErrorMessage header="Wrong credentials">
              <>
                Provided credentials were rejected by server. Please confirm whether pasted API key
                is valid.
              </>
            </ErrorMessage>
          );
        case AirlyAPIStatus.OTHER_ERROR:
          return (
            <ErrorMessage header="Communication problem">
              <>
                There was an unexpected response while requesting sensor station data. Request will
                be send again in a few minutes.
              </>
            </ErrorMessage>
          );
        case AirlyAPIStatus.NO_STATION:
          return (
            <ErrorMessage>
              <>There is no sensor station available in your vicinity.</>
            </ErrorMessage>
          );
      }
    }

    if (this.props.currentMeasurements) {
      const station = this.props.nearestStation;
      // tslint:disable-next-line:max-line-length
      const stationUrl = `https://map.airly.eu/en/#latitude=${
        station.location.latitude
      }&longitude=${station.location.longitude}&id=${station.id}`;

      const updateAlert = this.props.availableAppUpdate ? (
        <UpdateAlert
          onClickHandler={this.handleExtLinkClick.bind(this, this.props.availableAppUpdate.url)}
        />
      ) : null;

      return (
        <>
          {updateAlert}
          <AirQualityInfo airQualityIndex={this.props.currentMeasurements.airQualityIndex} />
          <MeasurementPane measurement={this.props.currentMeasurements} />
          <StationInfo
            station={station}
            onClickHandler={this.handleExtLinkClick.bind(this, stationUrl)}
          />
        </>
      );
    }

    return <Loader />;
  }
}

export default WindowContent;
