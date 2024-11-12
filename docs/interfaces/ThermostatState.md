[Mitsubishi Kumo Cloud Client](../README.md) / ThermostatState

# Interface: ThermostatState

Defines a thermostat's current status response.

## Extends

- `DeviceState`

## Properties

### coolTarget

> **coolTarget**: `number`

The thermostat target maximum temprature.

***

### heatTarget

> **heatTarget**: `number`

The thermostat target minimum temprature.

***

### state

> **state**: `"Off"` \| `"Heat"` \| `"Cool"` \| `"Auto"`

The thermostat target state.

#### Overrides

`DeviceState.state`

***

### temprature

> **temprature**: `number`

The thermostat's current temprature level.
