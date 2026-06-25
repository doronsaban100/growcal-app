# PlantMates Mobile Starter

React Native / Expo starter that mirrors the current PlantMates web product:

- market feed with search, status filter, and sorting
- personal collection and shop inventory
- live auction cards with local bid handling
- add-plant form that updates the local demo data
- bottom tab navigation and PlantMates visual language

## Run

```bash
npm install
npm run start
```

The first version uses local seed data so it can run before connecting Clerk and Convex.

## Next Backend Step

Connect the screens to the existing Convex functions:

- `api.plants.getForSalePlants`
- `api.plants.getMyPlants`
- `api.plants.getMyListingPlants`
- `api.plants.getAuctionPlants`
- `api.plants.updateStatus`
- `api.plants.updateWateringDate`
- `api.offers.createOffer`

For auth, use Clerk's React Native SDK and pass the token into Convex with `ConvexProviderWithAuth`.
