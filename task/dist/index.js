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
        console.log(`Current working path: ${process.cwd()}`);
        console.log(`Host machine arch ${os.arch()}`);
        const taskArgs = (0, input_parameters_1.parseInputParams)();
        const endorToken = getAuthToken();
        if (!endorToken) {
            const errorMsg = "auth info is not set. Setup apiKey and apiSecret in service connection and specify serviceConnectionEndpoint input parameter.";
            throw new Error(errorMsg);
        }
        if (!taskArgs.apiKey) {
            taskArgs.apiKey = endorToken.apiKey;
        }
        if (!taskArgs.apiSecret) {
            taskArgs.apiSecret = endorToken.apiSecret;
        }
        taskArgs.validate();
        console.log("Namespace is:", taskArgs.namespace);
        const endorctlPath = await (0, utils_1.setupEndorctl)({
            version: taskArgs.endorctlVersion,
            checksum: taskArgs.endorctlChecksum,
            api: taskArgs.endorAPI,
        });
        let endorctlParams = (0, scan_1.buildEndorctlRunOptions)(taskArgs);
        let toolRunner = tl.tool(endorctlPath).arg(endorctlParams);
        const exitCode = await toolRunner.execAsync();
        if (exitCode != 0) {
            console.log("Failed to scan endorctl");
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
function getAuthToken() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCx5REFBdUU7QUFDdkUsbUNBQXdDO0FBQ3hDLGlDQUFpRDtBQUVqRCx1Q0FBeUI7QUFFekIsS0FBSyxVQUFVLEdBQUc7SUFDaEIsSUFBSTtRQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU5QyxNQUFNLFFBQVEsR0FBb0IsSUFBQSxtQ0FBZ0IsR0FBRSxDQUFDO1FBQ3JELE1BQU0sVUFBVSxHQUFhLFlBQVksRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixNQUFNLFFBQVEsR0FDWiwrSEFBK0gsQ0FBQztZQUNsSSxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzNCO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDcEIsUUFBUSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1NBQ3JDO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUU7WUFDdkIsUUFBUSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO1NBQzNDO1FBRUQsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRXBCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVqRCxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUEscUJBQWEsRUFBQztZQUN2QyxPQUFPLEVBQUUsUUFBUSxDQUFDLGVBQWU7WUFDakMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0I7WUFDbkMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxRQUFRO1NBQ3ZCLENBQUMsQ0FBQztRQUVILElBQUksY0FBYyxHQUFHLElBQUEsOEJBQXVCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkQsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDOUMsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUN4QztLQUNGO0lBQUMsT0FBTyxHQUFRLEVBQUU7UUFDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDakQ7QUFDSCxDQUFDO0FBRUQsU0FBUyxZQUFZO0lBQ25CLE1BQU0seUJBQXlCLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FDM0MsMkJBQTJCLEVBQzNCLEtBQUssQ0FDTixDQUFDO0lBRUYsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1FBQzlCLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQWMsQ0FBQztLQUNoRTtTQUFNO1FBQ0wsSUFBSSx5QkFBeUIsRUFBRTtZQUM3QixNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQyx3QkFBd0IsQ0FDdkQseUJBQXlCLEVBQ3pCLEtBQUssQ0FDTixDQUFDO1lBQ0YsSUFBSSxxQkFBcUIsRUFBRTtnQkFDekIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRS9ELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQWMsQ0FBQzthQUM3RDtTQUNGO0tBQ0Y7SUFDRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFjLENBQUM7QUFDakUsQ0FBQztBQUVELEdBQUcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdGwgZnJvbSBcImF6dXJlLXBpcGVsaW5lcy10YXNrLWxpYi90YXNrXCI7XG5pbXBvcnQgeyBJbnB1dFBhcmFtZXRlcnMsIHBhcnNlSW5wdXRQYXJhbXMgfSBmcm9tIFwiLi9pbnB1dC1wYXJhbWV0ZXJzXCI7XG5pbXBvcnQgeyBzZXR1cEVuZG9yY3RsIH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IGJ1aWxkRW5kb3JjdGxSdW5PcHRpb25zIH0gZnJvbSBcIi4vc2NhblwiO1xuaW1wb3J0IHsgQXV0aEluZm8gfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0ICogYXMgb3MgZnJvbSBcIm9zXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bigpIHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhgQ3VycmVudCB3b3JraW5nIHBhdGg6ICR7cHJvY2Vzcy5jd2QoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgSG9zdCBtYWNoaW5lIGFyY2ggJHtvcy5hcmNoKCl9YCk7XG5cbiAgICBjb25zdCB0YXNrQXJnczogSW5wdXRQYXJhbWV0ZXJzID0gcGFyc2VJbnB1dFBhcmFtcygpO1xuICAgIGNvbnN0IGVuZG9yVG9rZW46IEF1dGhJbmZvID0gZ2V0QXV0aFRva2VuKCk7XG4gICAgaWYgKCFlbmRvclRva2VuKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgIFwiYXV0aCBpbmZvIGlzIG5vdCBzZXQuIFNldHVwIGFwaUtleSBhbmQgYXBpU2VjcmV0IGluIHNlcnZpY2UgY29ubmVjdGlvbiBhbmQgc3BlY2lmeSBzZXJ2aWNlQ29ubmVjdGlvbkVuZHBvaW50IGlucHV0IHBhcmFtZXRlci5cIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXNrQXJncy5hcGlLZXkpIHtcbiAgICAgIHRhc2tBcmdzLmFwaUtleSA9IGVuZG9yVG9rZW4uYXBpS2V5O1xuICAgIH1cblxuICAgIGlmICghdGFza0FyZ3MuYXBpU2VjcmV0KSB7XG4gICAgICB0YXNrQXJncy5hcGlTZWNyZXQgPSBlbmRvclRva2VuLmFwaVNlY3JldDtcbiAgICB9XG5cbiAgICB0YXNrQXJncy52YWxpZGF0ZSgpO1xuXG4gICAgY29uc29sZS5sb2coXCJOYW1lc3BhY2UgaXM6XCIsIHRhc2tBcmdzLm5hbWVzcGFjZSk7XG5cbiAgICBjb25zdCBlbmRvcmN0bFBhdGggPSBhd2FpdCBzZXR1cEVuZG9yY3RsKHtcbiAgICAgIHZlcnNpb246IHRhc2tBcmdzLmVuZG9yY3RsVmVyc2lvbixcbiAgICAgIGNoZWNrc3VtOiB0YXNrQXJncy5lbmRvcmN0bENoZWNrc3VtLFxuICAgICAgYXBpOiB0YXNrQXJncy5lbmRvckFQSSxcbiAgICB9KTtcblxuICAgIGxldCBlbmRvcmN0bFBhcmFtcyA9IGJ1aWxkRW5kb3JjdGxSdW5PcHRpb25zKHRhc2tBcmdzKTtcblxuICAgIGxldCB0b29sUnVubmVyID0gdGwudG9vbChlbmRvcmN0bFBhdGgpLmFyZyhlbmRvcmN0bFBhcmFtcyk7XG4gICAgY29uc3QgZXhpdENvZGUgPSBhd2FpdCB0b29sUnVubmVyLmV4ZWNBc3luYygpO1xuICAgIGlmIChleGl0Q29kZSAhPSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBzY2FuIGVuZG9yY3RsXCIpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0bC5zZXRSZXN1bHQodGwuVGFza1Jlc3VsdC5GYWlsZWQsIGVyci5tZXNzYWdlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBdXRoVG9rZW4oKSB7XG4gIGNvbnN0IHNlcnZpY2VDb25uZWN0aW9uRW5kcG9pbnQgPSB0bC5nZXRJbnB1dChcbiAgICBcInNlcnZpY2VDb25uZWN0aW9uRW5kcG9pbnRcIixcbiAgICBmYWxzZSxcbiAgKTtcblxuICBpZiAoIXNlcnZpY2VDb25uZWN0aW9uRW5kcG9pbnQpIHtcbiAgICByZXR1cm4geyBhcGlLZXk6IHVuZGVmaW5lZCwgYXBpU2VjcmV0OiB1bmRlZmluZWQgfSBhcyBBdXRoSW5mbztcbiAgfSBlbHNlIHtcbiAgICBpZiAoc2VydmljZUNvbm5lY3Rpb25FbmRwb2ludCkge1xuICAgICAgY29uc3QgZW5kcG9pbnRBdXRob3JpemF0aW9uID0gdGwuZ2V0RW5kcG9pbnRBdXRob3JpemF0aW9uKFxuICAgICAgICBzZXJ2aWNlQ29ubmVjdGlvbkVuZHBvaW50LFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG4gICAgICBpZiAoZW5kcG9pbnRBdXRob3JpemF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFwaUtleSA9IGVuZHBvaW50QXV0aG9yaXphdGlvbi5wYXJhbWV0ZXJzW1widXNlcm5hbWVcIl07XG4gICAgICAgIGNvbnN0IGFwaVNlY3JldCA9IGVuZHBvaW50QXV0aG9yaXphdGlvbi5wYXJhbWV0ZXJzW1wicGFzc3dvcmRcIl07XG5cbiAgICAgICAgcmV0dXJuIHsgYXBpS2V5OiBhcGlLZXksIGFwaVNlY3JldDogYXBpU2VjcmV0IH0gYXMgQXV0aEluZm87XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB7IGFwaUtleTogdW5kZWZpbmVkLCBhcGlTZWNyZXQ6IHVuZGVmaW5lZCB9IGFzIEF1dGhJbmZvO1xufVxuXG5ydW4oKTtcbiJdfQ==