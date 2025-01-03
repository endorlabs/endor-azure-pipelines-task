"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const input_parameters_1 = require("./input-parameters");
const utils_1 = require("./utils");
const scan_1 = require("./scan");
const os = __importStar(require("os"));
async function run() {
    try {
        console.log(`Setting up endorctl scan at path: ${process.cwd()} for ${os.arch()} host architecture`);
        const taskArgs = (0, input_parameters_1.parseInputParams)();
        const endorToken = getAuthFromServiceConnection();
        if (!endorToken && (!taskArgs.apiKey || !taskArgs.apiSecret)) {
            const errorMsg = "endorctl auth info is not set. Setup apiKey and apiSecret in service connection and specify serviceConnectionEndpoint input parameter.";
            throw new Error(errorMsg);
        }
        const isDebugEnabled = taskArgs.logLevel === "debug";
        if (!taskArgs.apiKey) {
            if (isDebugEnabled) {
                console.log("Setting apiKey from service connection");
            }
            taskArgs.apiKey = endorToken.apiKey;
        }
        if (!taskArgs.apiSecret) {
            if (isDebugEnabled) {
                console.log("Setting apiSecret from service connection");
            }
            taskArgs.apiSecret = endorToken.apiSecret;
        }
        taskArgs.validate();
        console.log("Namespace is set to:", taskArgs.namespace);
        const endorctlPath = await (0, utils_1.setupEndorctl)({
            version: taskArgs.endorctlVersion,
            checksum: taskArgs.endorctlChecksum,
            api: taskArgs.endorAPI,
        });
        let endorctlParams = (0, scan_1.buildEndorctlRunOptions)(taskArgs);
        let toolRunner = tl.tool(endorctlPath).arg(endorctlParams);
        const exitCode = await toolRunner.execAsync();
        if (exitCode != 0) {
            console.log("Endorctl scan failed with exit code:", exitCode);
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
function getAuthFromServiceConnection() {
    const serviceConnectionEndpoint = tl.getInput("serviceConnectionEndpoint", false);
    if (!serviceConnectionEndpoint) {
        return { apiKey: undefined, apiSecret: undefined };
    }
    else {
        if (serviceConnectionEndpoint) {
            const endpointAuthorization = tl.getEndpointAuthorization(serviceConnectionEndpoint, false);
            if (endpointAuthorization) {
                const apiKey = endpointAuthorization.parameters["username"];
                const apiSecret = endpointAuthorization.parameters["password"];
                return { apiKey: apiKey, apiSecret: apiSecret };
            }
        }
    }
    return { apiKey: undefined, apiSecret: undefined };
}
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCx5REFBdUU7QUFDdkUsbUNBQXdDO0FBQ3hDLGlDQUFpRDtBQUVqRCx1Q0FBeUI7QUFFekIsS0FBSyxVQUFVLEdBQUc7SUFDaEIsSUFBSTtRQUNGLE9BQU8sQ0FBQyxHQUFHLENBQ1QscUNBQXFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUN4RixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQW9CLElBQUEsbUNBQWdCLEdBQUUsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBYSw0QkFBNEIsRUFBRSxDQUFDO1FBQzVELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDNUQsTUFBTSxRQUFRLEdBQ1osd0lBQXdJLENBQUM7WUFDM0ksTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUMzQjtRQUVELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDO1FBRXJELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ3BCLElBQUksY0FBYyxFQUFFO2dCQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7YUFDdkQ7WUFDRCxRQUFRLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7U0FDckM7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUN2QixJQUFJLGNBQWMsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO2FBQzFEO1lBQ0QsUUFBUSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO1NBQzNDO1FBRUQsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRXBCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhELE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSxxQkFBYSxFQUFDO1lBQ3ZDLE9BQU8sRUFBRSxRQUFRLENBQUMsZUFBZTtZQUNqQyxRQUFRLEVBQUUsUUFBUSxDQUFDLGdCQUFnQjtZQUNuQyxHQUFHLEVBQUUsUUFBUSxDQUFDLFFBQVE7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxjQUFjLEdBQUcsSUFBQSw4QkFBdUIsRUFBQyxRQUFRLENBQUMsQ0FBQztRQUV2RCxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzRCxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM5QyxJQUFJLFFBQVEsSUFBSSxDQUFDLEVBQUU7WUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMvRDtLQUNGO0lBQUMsT0FBTyxHQUFRLEVBQUU7UUFDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDakQ7QUFDSCxDQUFDO0FBRUQsU0FBUyw0QkFBNEI7SUFDbkMsTUFBTSx5QkFBeUIsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUMzQywyQkFBMkIsRUFDM0IsS0FBSyxDQUNOLENBQUM7SUFFRixJQUFJLENBQUMseUJBQXlCLEVBQUU7UUFDOUIsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBYyxDQUFDO0tBQ2hFO1NBQU07UUFDTCxJQUFJLHlCQUF5QixFQUFFO1lBQzdCLE1BQU0scUJBQXFCLEdBQUcsRUFBRSxDQUFDLHdCQUF3QixDQUN2RCx5QkFBeUIsRUFDekIsS0FBSyxDQUNOLENBQUM7WUFDRixJQUFJLHFCQUFxQixFQUFFO2dCQUN6QixNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzVELE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFL0QsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBYyxDQUFDO2FBQzdEO1NBQ0Y7S0FDRjtJQUNELE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQWMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsR0FBRyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0bCBmcm9tIFwiYXp1cmUtcGlwZWxpbmVzLXRhc2stbGliL3Rhc2tcIjtcbmltcG9ydCB7IElucHV0UGFyYW1ldGVycywgcGFyc2VJbnB1dFBhcmFtcyB9IGZyb20gXCIuL2lucHV0LXBhcmFtZXRlcnNcIjtcbmltcG9ydCB7IHNldHVwRW5kb3JjdGwgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgYnVpbGRFbmRvcmN0bFJ1bk9wdGlvbnMgfSBmcm9tIFwiLi9zY2FuXCI7XG5pbXBvcnQgeyBBdXRoSW5mbyB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuYXN5bmMgZnVuY3Rpb24gcnVuKCkge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFNldHRpbmcgdXAgZW5kb3JjdGwgc2NhbiBhdCBwYXRoOiAke3Byb2Nlc3MuY3dkKCl9IGZvciAke29zLmFyY2goKX0gaG9zdCBhcmNoaXRlY3R1cmVgXG4gICAgKTtcblxuICAgIGNvbnN0IHRhc2tBcmdzOiBJbnB1dFBhcmFtZXRlcnMgPSBwYXJzZUlucHV0UGFyYW1zKCk7XG4gICAgY29uc3QgZW5kb3JUb2tlbjogQXV0aEluZm8gPSBnZXRBdXRoRnJvbVNlcnZpY2VDb25uZWN0aW9uKCk7XG4gICAgaWYgKCFlbmRvclRva2VuICYmICghdGFza0FyZ3MuYXBpS2V5IHx8ICF0YXNrQXJncy5hcGlTZWNyZXQpKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgIFwiZW5kb3JjdGwgYXV0aCBpbmZvIGlzIG5vdCBzZXQuIFNldHVwIGFwaUtleSBhbmQgYXBpU2VjcmV0IGluIHNlcnZpY2UgY29ubmVjdGlvbiBhbmQgc3BlY2lmeSBzZXJ2aWNlQ29ubmVjdGlvbkVuZHBvaW50IGlucHV0IHBhcmFtZXRlci5cIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNEZWJ1Z0VuYWJsZWQgPSB0YXNrQXJncy5sb2dMZXZlbCA9PT0gXCJkZWJ1Z1wiO1xuXG4gICAgaWYgKCF0YXNrQXJncy5hcGlLZXkpIHtcbiAgICAgIGlmIChpc0RlYnVnRW5hYmxlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlNldHRpbmcgYXBpS2V5IGZyb20gc2VydmljZSBjb25uZWN0aW9uXCIpO1xuICAgICAgfVxuICAgICAgdGFza0FyZ3MuYXBpS2V5ID0gZW5kb3JUb2tlbi5hcGlLZXk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXNrQXJncy5hcGlTZWNyZXQpIHtcbiAgICAgIGlmIChpc0RlYnVnRW5hYmxlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlNldHRpbmcgYXBpU2VjcmV0IGZyb20gc2VydmljZSBjb25uZWN0aW9uXCIpO1xuICAgICAgfVxuICAgICAgdGFza0FyZ3MuYXBpU2VjcmV0ID0gZW5kb3JUb2tlbi5hcGlTZWNyZXQ7XG4gICAgfVxuXG4gICAgdGFza0FyZ3MudmFsaWRhdGUoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiTmFtZXNwYWNlIGlzIHNldCB0bzpcIiwgdGFza0FyZ3MubmFtZXNwYWNlKTtcblxuICAgIGNvbnN0IGVuZG9yY3RsUGF0aCA9IGF3YWl0IHNldHVwRW5kb3JjdGwoe1xuICAgICAgdmVyc2lvbjogdGFza0FyZ3MuZW5kb3JjdGxWZXJzaW9uLFxuICAgICAgY2hlY2tzdW06IHRhc2tBcmdzLmVuZG9yY3RsQ2hlY2tzdW0sXG4gICAgICBhcGk6IHRhc2tBcmdzLmVuZG9yQVBJLFxuICAgIH0pO1xuXG4gICAgbGV0IGVuZG9yY3RsUGFyYW1zID0gYnVpbGRFbmRvcmN0bFJ1bk9wdGlvbnModGFza0FyZ3MpO1xuXG4gICAgbGV0IHRvb2xSdW5uZXIgPSB0bC50b29sKGVuZG9yY3RsUGF0aCkuYXJnKGVuZG9yY3RsUGFyYW1zKTtcbiAgICBjb25zdCBleGl0Q29kZSA9IGF3YWl0IHRvb2xSdW5uZXIuZXhlY0FzeW5jKCk7XG4gICAgaWYgKGV4aXRDb2RlICE9IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRW5kb3JjdGwgc2NhbiBmYWlsZWQgd2l0aCBleGl0IGNvZGU6XCIsIGV4aXRDb2RlKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgdGwuc2V0UmVzdWx0KHRsLlRhc2tSZXN1bHQuRmFpbGVkLCBlcnIubWVzc2FnZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QXV0aEZyb21TZXJ2aWNlQ29ubmVjdGlvbigpIHtcbiAgY29uc3Qgc2VydmljZUNvbm5lY3Rpb25FbmRwb2ludCA9IHRsLmdldElucHV0KFxuICAgIFwic2VydmljZUNvbm5lY3Rpb25FbmRwb2ludFwiLFxuICAgIGZhbHNlXG4gICk7XG5cbiAgaWYgKCFzZXJ2aWNlQ29ubmVjdGlvbkVuZHBvaW50KSB7XG4gICAgcmV0dXJuIHsgYXBpS2V5OiB1bmRlZmluZWQsIGFwaVNlY3JldDogdW5kZWZpbmVkIH0gYXMgQXV0aEluZm87XG4gIH0gZWxzZSB7XG4gICAgaWYgKHNlcnZpY2VDb25uZWN0aW9uRW5kcG9pbnQpIHtcbiAgICAgIGNvbnN0IGVuZHBvaW50QXV0aG9yaXphdGlvbiA9IHRsLmdldEVuZHBvaW50QXV0aG9yaXphdGlvbihcbiAgICAgICAgc2VydmljZUNvbm5lY3Rpb25FbmRwb2ludCxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICBpZiAoZW5kcG9pbnRBdXRob3JpemF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFwaUtleSA9IGVuZHBvaW50QXV0aG9yaXphdGlvbi5wYXJhbWV0ZXJzW1widXNlcm5hbWVcIl07XG4gICAgICAgIGNvbnN0IGFwaVNlY3JldCA9IGVuZHBvaW50QXV0aG9yaXphdGlvbi5wYXJhbWV0ZXJzW1wicGFzc3dvcmRcIl07XG5cbiAgICAgICAgcmV0dXJuIHsgYXBpS2V5OiBhcGlLZXksIGFwaVNlY3JldDogYXBpU2VjcmV0IH0gYXMgQXV0aEluZm87XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB7IGFwaUtleTogdW5kZWZpbmVkLCBhcGlTZWNyZXQ6IHVuZGVmaW5lZCB9IGFzIEF1dGhJbmZvO1xufVxuXG5ydW4oKTtcbiJdfQ==