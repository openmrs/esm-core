[Back to README.md](../README.md)

# @openmrs/esm-error-handling

## Table of contents

### Functions

- [createErrorHandler](API.md#createerrorhandler)
- [handleApiError](API.md#handleapierror)
- [reportError](API.md#reporterror)

## Functions

### createErrorHandler

▸ **createErrorHandler**(): (`incomingErr`: `any`) => `void`

#### Returns

`fn`

▸ (`incomingErr`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `incomingErr` | `any` |

##### Returns

`void`

#### Defined in

[index.ts:31](https://github.com/openmrs/openmrs-esm-core/blob/master/packages/framework/esm-error-handling/src/index.ts#L31)

___

### handleApiError

▸ **handleApiError**(): (`incomingResponseErr`: `any`) => `void`

#### Returns

`fn`

▸ (`incomingResponseErr`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `incomingResponseErr` | `any` |

##### Returns

`void`

#### Defined in

[index.ts:3](https://github.com/openmrs/openmrs-esm-core/blob/master/packages/framework/esm-error-handling/src/index.ts#L3)

___

### reportError

▸ **reportError**(`err`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `any` |

#### Returns

`void`

#### Defined in

[index.ts:24](https://github.com/openmrs/openmrs-esm-core/blob/master/packages/framework/esm-error-handling/src/index.ts#L24)
