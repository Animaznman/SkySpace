# SkySpace
School project from USF to try and apply some data architecture.
`conda create --name skyspace python=3.11`


docker build --platform=linux/amd64 -t gcr.io/skyspace-476120/firehose_service/firehose_service:latest .

sudo docker push gcr.io/skyspace-476120/firehose_service/firehose_service:latest