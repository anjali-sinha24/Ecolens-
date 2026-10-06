# EcoLens Bedrock coach

The coach is wired to the existing API Gateway/Lambda endpoint, but remains
inactive until configured. The calculator continues to show its local
recommendations and does not send coach requests while
`BEDROCK_COACH_ENABLED` is `false` in `calculator.js`.

To enable the integration:

1. Deploy `lambda_function.py` to the Lambda function behind `AWS_API_URL`.
2. Set Lambda environment variables `BEDROCK_ENABLED=true` and
   `BEDROCK_MODEL_ID` to a model available in the Lambda's AWS region.
3. Grant the Lambda execution role `bedrock:InvokeModel` permission for that
   model.
4. Set `BEDROCK_COACH_ENABLED` to `true` in `calculator.js` and publish the
   updated static site.

The Lambda invokes Bedrock server-side with its execution role; AWS credentials
must not be placed in browser code. Bedrock calls remain disabled unless both
the Lambda setting and the frontend switch are enabled.
