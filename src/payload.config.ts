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
import {searchPlugin} from '@payloadcms/plugin-search'
import {extractLorePlainText} from './lib/loreSearch'

import {Users} from './collections/Users'
import {Media} from './collections/Media'
import {Pages} from './collections/Pages'
import {LoreArticles} from './collections/LoreArticles'
import {Characters} from './collections/Characters'
import {CharacterWorkspaces} from './collections/CharacterWorkspaces'
import {Formations} from './collections/Formations'
import {SpecialRoles} from './collections/SpecialRoles'
import {Ships} from './collections/Ships'
import {ShipModels} from './collections/ShipModels'
import {ShipSaleModels} from './collections/ShipSaleModels'
import {ShipWeapons} from './collections/ShipWeapons'
import {ShipModules} from './collections/ShipModules'
import {ShipConsumables} from './collections/ShipConsumables'
import {VehicleVariants} from './collections/VehicleVariants'
import {VehicleSaleModels} from './collections/VehicleSaleModels'
import {Vehicles} from './collections/Vehicles'
import {Weapons} from './collections/Weapons'
import {Armors} from './collections/Armors'
import {ArmorSets} from './collections/ArmorSets'
import {Groups} from './collections/Groups'
import {Mods} from './collections/Mods'
import {Consumables} from './collections/Consumables'
import {Chips} from './collections/Chips'
import {Factions} from './collections/Factions'
import {FactionRewardTiers} from './collections/FactionRewardTiers'
import {SessionRewards} from './collections/SessionRewards'
import {ShopTransactions} from './collections/ShopTransactions'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { User } from './payload-types'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Media, Pages, LoreArticles, Groups, Ships, ShipModels, ShipSaleModels, ShipWeapons, ShipModules, ShipConsumables, VehicleVariants, VehicleSaleModels, Vehicles, Weapons, Armors, ArmorSets, Characters, CharacterWorkspaces, Formations, SpecialRoles, Mods, Consumables, Chips, Factions, FactionRewardTiers, SessionRewards, ShopTransactions],
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
    email: nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM!,
        defaultFromName: process.env.EMAIL_FROM_NAME!,
        transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 465),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        },
    }),
    secret: process.env.PAYLOAD_SECRET || '',
    // Le frontend n'utilise que l'API locale et REST : GraphQL n'est pas exposé.
    graphQL: {
        disable: true,
    },
    // Taille maximale d'un fichier envoyé vers le bucket (5 Mo).
    upload: {
        limits: {
            fileSize: 5_000_000,
        },
    },
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL || '',
            options: '-c search_path=public',
        },
        migrationDir: path.resolve(dirname, 'migrations'),
        push: false,
    }),
    sharp,
    plugins: [
        searchPlugin({
            collections: ['lore-articles'],
            searchOverrides: {
                // Les résultats sont synchronisés automatiquement : seuls les admins peuvent y toucher.
                access: {
                    update: ({ req }) => (req.user as User | null)?.role === 'admin',
                    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
                },
                fields: ({ defaultFields }) => [
                    ...defaultFields,
                    {
                        name: 'excerpt',
                        type: 'textarea',
                    },
                ],
            },
            beforeSync: ({ originalDoc, searchDoc }) => ({
                ...searchDoc,
                excerpt: [originalDoc.excerpt, extractLorePlainText(originalDoc.content)]
                    .filter(Boolean)
                    .join('\n\n'),
            }),
        }),
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
