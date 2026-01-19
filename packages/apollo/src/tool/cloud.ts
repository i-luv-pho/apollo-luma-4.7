import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./cloud.txt"
import { Log } from "../util/log"
import { Credentials } from "./credentials"

const log = Log.create({ service: "cloud-tool" })

/**
 * AWS S3 operations.
 */
async function awsS3(
  action: string,
  params: { bucket?: string; key?: string; body?: string; prefix?: string },
  credentials?: { accessKeyId: string; secretAccessKey: string; region?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const { S3Client, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3").catch(() => {
      throw new Error("AWS SDK not installed. Run: npm install @aws-sdk/client-s3")
    })

    const client = new S3Client({
      region: credentials?.region || process.env.AWS_REGION || "us-east-1",
      credentials: credentials ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      } : undefined,
    })

    switch (action) {
      case "list-buckets": {
        const response = await client.send(new ListBucketsCommand({}))
        return { success: true, data: response.Buckets?.map(b => ({ name: b.Name, created: b.CreationDate })) }
      }
      case "list": {
        if (!params.bucket) throw new Error("Bucket name required")
        const response = await client.send(new ListObjectsV2Command({
          Bucket: params.bucket,
          Prefix: params.prefix,
          MaxKeys: 100,
        }))
        return { success: true, data: response.Contents?.map(o => ({ key: o.Key, size: o.Size, modified: o.LastModified })) }
      }
      case "get": {
        if (!params.bucket || !params.key) throw new Error("Bucket and key required")
        const response = await client.send(new GetObjectCommand({
          Bucket: params.bucket,
          Key: params.key,
        }))
        const body = await response.Body?.transformToString()
        return { success: true, data: { body, contentType: response.ContentType, size: response.ContentLength } }
      }
      case "put": {
        if (!params.bucket || !params.key || !params.body) throw new Error("Bucket, key, and body required")
        await client.send(new PutObjectCommand({
          Bucket: params.bucket,
          Key: params.key,
          Body: params.body,
        }))
        return { success: true, data: { message: `Uploaded to s3://${params.bucket}/${params.key}` } }
      }
      case "delete": {
        if (!params.bucket || !params.key) throw new Error("Bucket and key required")
        await client.send(new DeleteObjectCommand({
          Bucket: params.bucket,
          Key: params.key,
        }))
        return { success: true, data: { message: `Deleted s3://${params.bucket}/${params.key}` } }
      }
      default:
        throw new Error(`Unknown S3 action: ${action}`)
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * AWS EC2 operations.
 */
async function awsEC2(
  action: string,
  params: { instanceId?: string; instanceIds?: string[] },
  credentials?: { accessKeyId: string; secretAccessKey: string; region?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const { EC2Client, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand } = await import("@aws-sdk/client-ec2").catch(() => {
      throw new Error("AWS SDK not installed. Run: npm install @aws-sdk/client-ec2")
    })

    const client = new EC2Client({
      region: credentials?.region || process.env.AWS_REGION || "us-east-1",
      credentials: credentials ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      } : undefined,
    })

    switch (action) {
      case "list": {
        const response = await client.send(new DescribeInstancesCommand({}))
        const instances = response.Reservations?.flatMap(r => r.Instances || []).map(i => ({
          id: i.InstanceId,
          type: i.InstanceType,
          state: i.State?.Name,
          publicIp: i.PublicIpAddress,
          privateIp: i.PrivateIpAddress,
          name: i.Tags?.find(t => t.Key === "Name")?.Value,
        }))
        return { success: true, data: instances }
      }
      case "describe": {
        if (!params.instanceId) throw new Error("Instance ID required")
        const response = await client.send(new DescribeInstancesCommand({
          InstanceIds: [params.instanceId],
        }))
        const instance = response.Reservations?.[0]?.Instances?.[0]
        return { success: true, data: instance }
      }
      case "start": {
        const ids = params.instanceIds || (params.instanceId ? [params.instanceId] : [])
        if (ids.length === 0) throw new Error("Instance ID(s) required")
        const response = await client.send(new StartInstancesCommand({ InstanceIds: ids }))
        return { success: true, data: response.StartingInstances }
      }
      case "stop": {
        const ids = params.instanceIds || (params.instanceId ? [params.instanceId] : [])
        if (ids.length === 0) throw new Error("Instance ID(s) required")
        const response = await client.send(new StopInstancesCommand({ InstanceIds: ids }))
        return { success: true, data: response.StoppingInstances }
      }
      default:
        throw new Error(`Unknown EC2 action: ${action}`)
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * AWS Lambda operations.
 */
async function awsLambda(
  action: string,
  params: { functionName?: string; payload?: unknown },
  credentials?: { accessKeyId: string; secretAccessKey: string; region?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const { LambdaClient, ListFunctionsCommand, InvokeCommand, GetFunctionCommand } = await import("@aws-sdk/client-lambda").catch(() => {
      throw new Error("AWS SDK not installed. Run: npm install @aws-sdk/client-lambda")
    })

    const client = new LambdaClient({
      region: credentials?.region || process.env.AWS_REGION || "us-east-1",
      credentials: credentials ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      } : undefined,
    })

    switch (action) {
      case "list": {
        const response = await client.send(new ListFunctionsCommand({}))
        const functions = response.Functions?.map(f => ({
          name: f.FunctionName,
          runtime: f.Runtime,
          memory: f.MemorySize,
          timeout: f.Timeout,
          lastModified: f.LastModified,
        }))
        return { success: true, data: functions }
      }
      case "describe": {
        if (!params.functionName) throw new Error("Function name required")
        const response = await client.send(new GetFunctionCommand({
          FunctionName: params.functionName,
        }))
        return { success: true, data: response.Configuration }
      }
      case "invoke": {
        if (!params.functionName) throw new Error("Function name required")
        const response = await client.send(new InvokeCommand({
          FunctionName: params.functionName,
          Payload: params.payload ? JSON.stringify(params.payload) : undefined,
        }))
        const payload = response.Payload ? new TextDecoder().decode(response.Payload) : undefined
        return {
          success: true,
          data: {
            statusCode: response.StatusCode,
            payload: payload ? JSON.parse(payload) : undefined,
            error: response.FunctionError,
          },
        }
      }
      default:
        throw new Error(`Unknown Lambda action: ${action}`)
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * GCP Storage operations.
 */
async function gcpStorage(
  action: string,
  params: { bucket?: string; object?: string; content?: string; prefix?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const { Storage } = await import("@google-cloud/storage").catch(() => {
      throw new Error("GCP SDK not installed. Run: npm install @google-cloud/storage")
    })

    const storage = new Storage()

    switch (action) {
      case "list-buckets": {
        const [buckets] = await storage.getBuckets()
        return { success: true, data: buckets.map(b => ({ name: b.name, created: b.metadata.timeCreated })) }
      }
      case "list": {
        if (!params.bucket) throw new Error("Bucket name required")
        const [files] = await storage.bucket(params.bucket).getFiles({ prefix: params.prefix, maxResults: 100 })
        return { success: true, data: files.map(f => ({ name: f.name, size: f.metadata.size, updated: f.metadata.updated })) }
      }
      case "get": {
        if (!params.bucket || !params.object) throw new Error("Bucket and object name required")
        const [content] = await storage.bucket(params.bucket).file(params.object).download()
        return { success: true, data: content.toString() }
      }
      case "put": {
        if (!params.bucket || !params.object || !params.content) throw new Error("Bucket, object, and content required")
        await storage.bucket(params.bucket).file(params.object).save(params.content)
        return { success: true, data: { message: `Uploaded to gs://${params.bucket}/${params.object}` } }
      }
      case "delete": {
        if (!params.bucket || !params.object) throw new Error("Bucket and object name required")
        await storage.bucket(params.bucket).file(params.object).delete()
        return { success: true, data: { message: `Deleted gs://${params.bucket}/${params.object}` } }
      }
      default:
        throw new Error(`Unknown Storage action: ${action}`)
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export const CloudTool = Tool.define("cloud", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      provider: z
        .enum(["aws", "gcp", "azure"])
        .describe("Cloud provider"),
      service: z
        .enum(["s3", "ec2", "lambda", "storage", "compute", "functions"])
        .describe("Cloud service to interact with"),
      action: z
        .string()
        .describe("Action to perform (list, get, put, delete, start, stop, invoke, etc.)"),

      // Common params
      credentialName: z.string().optional().describe("Name of stored AWS/GCP credentials"),
      region: z.string().optional().describe("Cloud region"),

      // S3/Storage params
      bucket: z.string().optional().describe("Bucket name"),
      key: z.string().optional().describe("Object key (S3) or object name (GCS)"),
      object: z.string().optional().describe("Object name for GCS"),
      prefix: z.string().optional().describe("Prefix for listing objects"),
      body: z.string().optional().describe("Content to upload"),
      content: z.string().optional().describe("Content to upload (GCS)"),

      // EC2/Compute params
      instanceId: z.string().optional().describe("Instance ID"),
      instanceIds: z.array(z.string()).optional().describe("Multiple instance IDs"),

      // Lambda/Functions params
      functionName: z.string().optional().describe("Function name"),
      payload: z.unknown().optional().describe("Function invocation payload"),
    }),
    async execute(params, ctx) {
      // Determine permission level
      const writeActions = ["put", "delete", "start", "stop", "invoke", "create", "update"]
      const deleteActions = ["delete", "terminate"]

      let permissionType = "cloud"
      if (deleteActions.some(a => params.action.includes(a))) {
        permissionType = "cloud_delete"
      } else if (writeActions.some(a => params.action.includes(a))) {
        permissionType = "cloud_write"
      }

      await ctx.ask({
        permission: permissionType,
        patterns: [`${params.provider}:${params.service}:${params.action}`],
        always: [`${params.provider}:${params.service}:*`],
        metadata: {},
      })

      // Get credentials
      let credentials: any
      if (params.credentialName) {
        const cred = await Credentials.getTyped(params.credentialName, "aws")
        if (cred) {
          credentials = {
            accessKeyId: cred.accessKeyId,
            secretAccessKey: cred.secretAccessKey,
            region: cred.region || params.region,
          }
        }
      }

      let result: { success: boolean; data?: unknown; error?: string }

      // Route to appropriate handler
      if (params.provider === "aws") {
        switch (params.service) {
          case "s3":
            result = await awsS3(params.action, {
              bucket: params.bucket,
              key: params.key,
              body: params.body,
              prefix: params.prefix,
            }, credentials)
            break
          case "ec2":
            result = await awsEC2(params.action, {
              instanceId: params.instanceId,
              instanceIds: params.instanceIds,
            }, credentials)
            break
          case "lambda":
            result = await awsLambda(params.action, {
              functionName: params.functionName,
              payload: params.payload,
            }, credentials)
            break
          default:
            throw new Error(`Unsupported AWS service: ${params.service}`)
        }
      } else if (params.provider === "gcp") {
        switch (params.service) {
          case "storage":
            result = await gcpStorage(params.action, {
              bucket: params.bucket,
              object: params.object || params.key,
              content: params.content || params.body,
              prefix: params.prefix,
            })
            break
          default:
            throw new Error(`Unsupported GCP service: ${params.service}. Supported: storage`)
        }
      } else {
        throw new Error(`Provider ${params.provider} not yet implemented. Supported: aws, gcp`)
      }

      if (!result.success) {
        throw new Error(result.error || "Cloud operation failed")
      }

      return {
        title: `${params.provider}:${params.service}:${params.action}`,
        metadata: {},
        output: typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2),
      }
    },
  }
})
