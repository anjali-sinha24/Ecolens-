import json
import math
import os


def generate_bedrock_recommendations(body):
    if os.environ.get("BEDROCK_ENABLED", "").lower() != "true":
        raise RuntimeError("Amazon Bedrock coach is disabled. Configure BEDROCK_ENABLED=true to enable it.")

    model_id = os.environ.get("BEDROCK_MODEL_ID")
    if not model_id:
        raise RuntimeError("BEDROCK_MODEL_ID is not configured.")

    breakdown = body.get("breakdown")
    if not isinstance(breakdown, dict):
        raise ValueError("breakdown must be an object.")

    categories = ("transportation", "electricity", "household", "water", "food", "flights")
    validated_breakdown = {}
    for category in categories:
        value = breakdown.get(category)
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
        ):
            raise ValueError(f"breakdown.{category} must be a non-negative number.")
        validated_breakdown[category] = round(value, 2)

    total = body.get("total_kg")
    if (
        isinstance(total, bool)
        or not isinstance(total, (int, float))
        or not math.isfinite(total)
        or total < 0
    ):
        raise ValueError("total_kg must be a non-negative number.")

    import boto3

    bedrock = boto3.client("bedrock-runtime")
    response = bedrock.converse(
        modelId=model_id,
        system=[{
            "text": (
                "You are an evidence-conscious personal sustainability coach. "
                "Give practical, safe, non-judgmental actions, without claiming "
                "the estimate is scientifically exact."
            )
        }],
        messages=[{
            "role": "user",
            "content": [{
                "text": (
                    "Based on this estimated monthly carbon footprint in kg CO2e, "
                    "return exactly 4 concise, practical recommendations as JSON only "
                    'with the shape {"recommendations":["...","...","...","..."]}. '
                    "Focus on the largest categories. Data: "
                    + json.dumps({
                        "total_kg": round(total, 2),
                        "breakdown": validated_breakdown
                    })
                )
            }]
        }],
        inferenceConfig={"maxTokens": 500, "temperature": 0.4}
    )

    output_text = "".join(
        item.get("text", "")
        for item in response["output"]["message"]["content"]
        if isinstance(item, dict)
    ).strip()

    try:
        result = json.loads(output_text)
    except json.JSONDecodeError as error:
        raise ValueError("Amazon Bedrock returned invalid JSON.") from error

    recommendations = result.get("recommendations") if isinstance(result, dict) else None
    if (
        not isinstance(recommendations, list)
        or len(recommendations) != 4
        or not all(isinstance(item, str) and item.strip() for item in recommendations)
    ):
        raise ValueError("Amazon Bedrock returned an invalid recommendation list.")

    return {
        "status": "success",
        "source": "Powered by Amazon Bedrock",
        "recommendations": recommendations
    }

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    }

    # Handle browser CORS preflight check
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"status": "ok"})
        }

    try:
        body = json.loads(event.get("body", "{}"))

        if body.get("action") == "coach":
            try:
                result = generate_bedrock_recommendations(body)
            except ValueError as e:
                return {
                    "statusCode": 400,
                    "headers": headers,
                    "body": json.dumps({"error": str(e)})
                }
            except RuntimeError as e:
                return {
                    "statusCode": 503,
                    "headers": headers,
                    "body": json.dumps({"error": str(e)})
                }
            except Exception:
                print("Amazon Bedrock coach invocation failed.")
                return {
                    "statusCode": 502,
                    "headers": headers,
                    "body": json.dumps({"error": "Amazon Bedrock could not generate recommendations."})
                }
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(result)
            }
        
        # User input values from your calculator form
        electricity = float(body.get("electricity", 0))
        transport = float(body.get("transport", 0))
        waste = float(body.get("waste", 0))

        # Carbon conversion metrics (kg CO2e)
        electricity_kg = electricity * 0.85
        transport_kg = transport * 0.17
        waste_kg = waste * 0.45

        total = electricity_kg + transport_kg + waste_kg

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "status": "success",
                "carbon_footprint_kg": round(total, 2),
                "breakdown": {
                    "electricity": round(electricity_kg, 2),
                    "transport": round(transport_kg, 2),
                    "waste": round(waste_kg, 2)
                },
                "source": "Powered by AWS Lambda"
            })
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }