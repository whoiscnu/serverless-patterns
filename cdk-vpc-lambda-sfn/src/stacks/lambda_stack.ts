import { Function, IFunction, Code, Architecture, Runtime } from '@aws-cdk/aws-lambda';
import { Policy, Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Stack, App, StackProps } from '@aws-cdk/core';

import * as path from 'path';
import { vpcProps } from './vpc_stack';

export class lambdaStack extends Stack {
    public readonly testLambda: IFunction;

    constructor(scope: App, id: string, props: vpcProps) {
        super(scope, id);
        const prefix = 'test-';

        const testLambda = new Function(this, 'testLambda', {
            functionName: `${prefix}lambdaFunction`,
            runtime: Runtime.NODEJS_14_X,
            architecture: Architecture.ARM_64,
            memorySize: 512,
            code: Code.fromAsset(path.join(__dirname, '../lambda_code')),
            handler: 'app.lambdaHandler',
            retryAttempts: 2,
            environment: {},
            logRetention: RetentionDays.ONE_WEEK,
            vpc: props.ivpc,
            securityGroups: [props.isg],

            vpcSubnets: { subnets: props.privatesb }
        });

        const lNetPolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses'
            ],
            resources: [testLambda.functionArn],
        });
        const lNetworkPolicy = new Policy(this, `${prefix}lNetworkPolicy`, {
            statements: [lNetPolicyStatement]
        });
        testLambda.role!.attachInlinePolicy(lNetworkPolicy);

        this.testLambda = testLambda;
    }
}

export interface lambdaProps extends StackProps {
    ltest: IFunction
}