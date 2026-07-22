# mazegame

A game about getting home

## Local

- npm install
- npm run dev
- visit http://localhost:8000

## Deploy

`./scripts/build.sh` - to create the build/ directory
`./scripts/deploy.sh` - to deploy the build/ directory to mazegame.callaway.family

## Run

- visit `https://mazegame.callaway.family`

## Infrastructure

- S3 bucket with static website hosting `mazegame.callaway.family`
  - https://us-east-1.console.aws.amazon.com/s3/buckets/mazegame.callaway.family?region=us-east-1&tab=objects
- CloudFront Distribution `E2WD5L6PRMPF3E`
  - https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=us-west-2#/distributions/E2WD5L6PRMPF3E
- Route53 DNS record mazegame.callaway.family
  - https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones?region=us-west-2#ListRecordSets/Z00209583PLQ2FRA02WFV
