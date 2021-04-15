import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import { FromSchema } from "json-schema-to-ts";
import type { Serverless } from "../types/serverless";
import { Component } from "../classes/Component";

const LIFT_COMPONENT_NAME_PATTERN = "^[a-zA-Z0-9-_]+$";
const STORAGE_COMPONENT = "storage";
const STORAGE_DEFINITION = {
    type: "object",
    properties: {
        cors: {
            anyOf: [{ type: "boolean" }, { type: "string" }],
        },
        encrypted: { type: "boolean" },
        public: { type: "boolean" },
    },
    additionalProperties: false,
} as const;
const STORAGE_DEFINITIONS = {
    type: "object",
    patternProperties: {
        [LIFT_COMPONENT_NAME_PATTERN]: STORAGE_DEFINITION,
    },
} as const;

const STORAGE_DEFAULTS: Required<FromSchema<typeof STORAGE_DEFINITION>> = {
    cors: false,
    encrypted: false,
    public: false,
};

export class Storage extends Component<
    typeof STORAGE_COMPONENT,
    typeof STORAGE_DEFINITIONS
> {
    constructor(serverless: Serverless) {
        super({
            name: STORAGE_COMPONENT,
            serverless,
            schema: STORAGE_DEFINITIONS,
        });
    }

    compile(): void {
        const configuration = this.getConfiguration();
        if (!configuration) {
            return;
        }
        Object.entries(configuration).map(
            ([storageName, storageConfiguration]) => {
                const resolvedStorageConfiguration = Object.assign(
                    STORAGE_DEFAULTS,
                    storageConfiguration
                );
                new Bucket(this.serverless.stack, storageName, {
                    bucketName: storageName.toLowerCase(),
                    encryption: resolvedStorageConfiguration.encrypted
                        ? BucketEncryption.KMS_MANAGED
                        : BucketEncryption.UNENCRYPTED,
                });
            }
        );
    }
}
