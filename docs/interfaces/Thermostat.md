[Mitsubishi Kumo Cloud Client](../README.md) / Thermostat

# Interface: Thermostat

Defines a thermostat device.

## Extends

- `Thermostat`

## Properties

### address

> **address**: `Address`

The href address of the device. This is mainly used for Lutron systems.

#### Inherited from

`ThermostatInterface.address`

***

### area

> **area**: `Area`

The area the device is in.

#### Inherited from

`ThermostatInterface.area`

***

### capabilities

> **capabilities**: `object`

The devices capibilities. This is a map of the fields that can be set
or read.

#### Index Signature

 \[`key`: `string`\]: `Capability`

#### Inherited from

`ThermostatInterface.capabilities`

***

### id

> **id**: `string`

The device's unique identifier.

#### Inherited from

`ThermostatInterface.id`

***

### limits

> `readonly` **limits**: `object`

The min and max target temprature limits.

#### max

> **max**: `number`

#### min

> **min**: `number`

***

### log

> **log**: `ILogger`

A logger for the device. This will automatically print the devices name,
room and id.

#### Inherited from

`ThermostatInterface.log`

***

### manufacturer

> **manufacturer**: `string`

The device's manufacturer.

#### Inherited from

`ThermostatInterface.manufacturer`

***

### name

> **name**: `string`

The device's configured name.

#### Inherited from

`ThermostatInterface.name`

***

### room

> **room**: `string`

The device's configured room.

#### Inherited from

`ThermostatInterface.room`

***

### status

> `readonly` **status**: [`ThermostatState`](ThermostatState.md)

The current state of the device.

#### Returns

The device's state.

#### Overrides

`ThermostatInterface.status`

***

### type

> **type**: `DeviceType`

The device type.

#### Inherited from

`ThermostatInterface.type`

## Methods

### emit()

> **emit**(`event`, ...`payload`): `boolean`

Emits events for this device.

#### Parameters

• **event**: `string`

The event to emit.

• ...**payload**: `any`[]

The payload attached to the event.

#### Returns

`boolean`

#### Inherited from

`ThermostatInterface.emit`

***

### off()

> **off**(`event`?, `listener`?): `this`

Unbinds a listener to an event.

#### Parameters

• **event?**: `string`

The event to unbind from.

• **listener?**: `Function`

The listener to unbind.

#### Returns

`this`

#### Inherited from

`ThermostatInterface.off`

***

### on()

> **on**(`event`, `listener`): `this`

Binds a listener to an event.

#### Parameters

• **event**: `string`

The event to bind to.

• **listener**: `Function`

The listener to bind.

#### Returns

`this`

#### Inherited from

`ThermostatInterface.on`

***

### once()

> **once**(`event`, `listener`): `this`

Binds a, rone once listener to an event.

#### Parameters

• **event**: `string`

The event to bind to.

• **listener**: `Function`

The listener to bind.

#### Returns

`this`

#### Inherited from

`ThermostatInterface.once`

***

### set()

> **set**(`status`): `Promise`\<`void`\>

Controls this device.

```js
dimmer.set({ state: "Heat", temprature: 28 });
```

#### Parameters

• **status**: `Partial`\<[`ThermostatState`](ThermostatState.md)\>

Desired device state.

#### Returns

`Promise`\<`void`\>

#### Overrides

`ThermostatInterface.set`

***

### update()

> **update**(`status`): `void`

Recieves a state response from the connection and updates the device
state.

```js
thermostat.update({ Temprature: 100 });
```

#### Parameters

• **status**: `ThermostatStatus`

The current device state.

#### Returns

`void`

#### Overrides

`ThermostatInterface.update`
