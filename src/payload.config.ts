import {postgresAdapter} from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  BlocksFeature,
} from '@payloadcms/richtext-lexical'
import { KeyValueBlock } from './blocks/KeyValueBlock'
import path from 'path'
import {buildConfig} from 'payload'
import {fileURLToPath} from 'url'
import sharp from 'sharp'
import {s3Storage} from '@payloadcms/storage-s3'

import {Users} from './collections/Users'
import {Media} from './collections/Media'
import {Pages} from './collections/Pages'
import {LoreArticles} from './collections/LoreArticles'
import {Characters} from './collections/Characters'
import {Ships} from './collections/Ships'
import {ShipModels} from './collections/ShipModels'
import {ShipSaleModels} from './collections/ShipSaleModels'
import {ShipWeapons} from './collections/ShipWeapons'
import {ShipModules} from './collections/ShipModules'
import {ShipConsumables} from './collections/ShipConsumables'
import {Weapons} from './collections/Weapons'
import {Armors} from './collections/Armors'
import {ArmorSets} from './collections/ArmorSets'
import {Groups} from './collections/Groups'
import {Mods} from './collections/Mods'
import {Consumables} from './collections/Consumables'
import {Chips} from './collections/Chips'
import {Factions} from './collections/Factions'
import {SessionRewards} from './collections/SessionRewards'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Media, Pages, LoreArticles, Groups, Ships, ShipModels, ShipSaleModels, ShipWeapons, ShipModules, ShipConsumables, Weapons, Armors, ArmorSets, Characters, Mods, Consumables, Chips, Factions, SessionRewards],
    editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures,
            BlocksFeature({
                blocks: [
                    KeyValueBlock,
                ],
            }),
        ],
    }),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL || '',
        },
    }),
    sharp,
    plugins: [
        s3Storage({
            collections: {
                media: true,
            },
            bucket: process.env.R2_BUCKET!,
            config: {
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
                },
                region: 'auto',
                endpoint: process.env.R2_ENDPOINT,
                forcePathStyle: true,
            },
        }),
    ]
})
