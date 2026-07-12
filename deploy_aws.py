import os
import sys
import zipfile
import time
import json
import tempfile
import boto3
from botocore.exceptions import ClientError

APPLICATION_NAME = "ApexTradeAI"
ENVIRONMENT_NAME = "ApexTradeAI-env"

# List of files/folders to include in the deployment ZIP
INCLUDES = [
    "app.py",
    "server.py",
    "stock_data.py",
    "ml_models.py",
    "sentiment_analysis.py",
    "utils.py",
    "database.py",
    "requirements.txt",
    "Dockerfile",
    ".dockerignore",
    "Procfile",
    "runtime.txt",
    "static",
]

def zip_project():
    """Create a temporary ZIP file containing the project assets."""
    print("[ZIP] Packaging project files...")
    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    temp_zip.close()
    
    with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zf:
        for item in INCLUDES:
            if os.path.isdir(item):
                for root, _, files in os.walk(item):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, os.getcwd())
                        zf.write(full_path, rel_path)
            elif os.path.exists(item):
                zf.write(item, item)
                
    print(f"[ZIP] Packaged successfully to temporary file: {temp_zip.name}")
    return temp_zip.name

def check_aws_credentials():
    """Verify AWS credentials are functional."""
    print("[AWS] Checking credentials...")
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"[SUCCESS] Authenticated as IAM user: {identity['Arn'].split('/')[-1]} (Account: {identity['Account']})")
        return identity['Account']
    except ClientError as e:
        print("\n[ERROR] AWS authentication failed!")
        print("Please configure your AWS credentials by running:")
        print("   aws configure")
        print("\nOr set the environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION")
        sys.exit(1)

def get_or_create_s3_bucket(account_id, region):
    """Create or retrieve a deployment S3 bucket."""
    bucket_name = f"apextrade-deploy-{account_id}-{region}"
    s3 = boto3.client('s3', region_name=region)
    print(f"[S3] Locating deployment S3 bucket: {bucket_name}...")
    try:
        s3.head_bucket(Bucket=bucket_name)
        print(f"[S3] Bucket '{bucket_name}' already exists.")
    except ClientError:
        print(f"[S3] Creating new bucket '{bucket_name}' in region '{region}'...")
        try:
            if region == 'us-east-1':
                s3.create_bucket(Bucket=bucket_name)
            else:
                s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': region}
                )
            print(f"[S3] Bucket '{bucket_name}' created successfully.")
        except ClientError as e:
            print(f"[ERROR] Failed to create S3 bucket: {e}")
            sys.exit(1)
    return bucket_name

def upload_zip_to_s3(s3_client, bucket_name, zip_path):
    """Upload deployment ZIP to S3 and return key name."""
    version_key = f"apextrade-v{int(time.time())}.zip"
    print(f"[S3] Uploading deployment bundle as: {version_key}...")
    try:
        s3_client.upload_file(zip_path, bucket_name, version_key)
        print("[S3] Upload completed.")
        return version_key
    except Exception as e:
        print(f"[ERROR] Failed to upload ZIP file to S3: {e}")
        sys.exit(1)

def get_latest_docker_platform(eb_client):
    """Dynamically fetch the latest Docker solution stack available in the region."""
    print("[EB] Fetching latest AWS Elastic Beanstalk Docker platform branch...")
    try:
        stacks = eb_client.list_available_solution_stacks()
        docker_stacks = [
            s for s in stacks['SolutionStacks'] 
            if 'Docker' in s and 'Amazon Linux' in s
        ]
        if not docker_stacks:
            # Fallback to standard solution stack if search fails
            print("[WARN] Could not locate custom Docker stack. Using fallback stack.")
            return "64bit Amazon Linux 2023 v4.4.1 running on Docker"
            
        latest_stack = docker_stacks[0]
        print(f"[EB] Selected latest platform: '{latest_stack}'")
        return latest_stack
    except Exception as e:
        print(f"[WARN] Error querying solution stacks: {e}. Using fallback.")
        return "64bit Amazon Linux 2023 v4.4.1 running on Docker"

def get_or_create_eb_roles():
    """Ensure standard Elastic Beanstalk service and instance profile roles are set up."""
    iam = boto3.client('iam')
    instance_profile_name = "aws-elasticbeanstalk-ec2-role"
    
    print(f"[IAM] Verifying instance profile: {instance_profile_name}...")
    try:
        iam.get_instance_profile(InstanceProfileName=instance_profile_name)
        print(f"[IAM] Instance profile '{instance_profile_name}' is configured.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchEntity':
            print(f"[IAM] Instance profile '{instance_profile_name}' not found. Attempting creation...")
            try:
                # 1. Create Role if it doesn't exist
                role_name = instance_profile_name
                try:
                    iam.get_role(RoleName=role_name)
                    print(f"[IAM] Role '{role_name}' already exists.")
                except ClientError as re:
                    if re.response['Error']['Code'] == 'NoSuchEntity':
                        assume_role_policy = {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "ec2.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        iam.create_role(
                            RoleName=role_name,
                            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
                        )
                        print(f"[IAM] Created IAM role '{role_name}'.")
                
                # 2. Attach Required Policies
                policies = [
                    "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
                    "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
                    "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
                ]
                for policy in policies:
                    iam.attach_role_policy(RoleName=role_name, PolicyArn=policy)
                print("[IAM] Attached policies to role.")
                
                # 3. Create Instance Profile & Add Role
                iam.create_instance_profile(InstanceProfileName=instance_profile_name)
                iam.add_role_to_instance_profile(
                    InstanceProfileName=instance_profile_name,
                    RoleName=role_name
                )
                print(f"[IAM] Configured instance profile '{instance_profile_name}'.")
                time.sleep(10)  # Wait for IAM propagation
            except ClientError as create_err:
                print(f"\n[ERROR] Failed to automatically create IAM roles: {create_err}")
                print("\nPlease log in to AWS Web Console, navigate to Elastic Beanstalk, and try creating an application.")
                print("AWS will automatically create the default 'aws-elasticbeanstalk-ec2-role' for you.")
                sys.exit(1)
        else:
            print(f"[ERROR] Error checking instance profile: {e}")
            sys.exit(1)

def deploy():
    # 1. Setup AWS Clients
    account_id = check_aws_credentials()
    
    # Resolve region
    session = boto3.Session()
    region = session.region_name
    if not region:
        region = 'us-east-1'  # Default fallback
        
    s3_client = boto3.client('s3', region_name=region)
    eb_client = boto3.client('elasticbeanstalk', region_name=region)
    
    # 2. Prepare IAM roles
    get_or_create_eb_roles()
    
    # 3. Create deployment S3 bucket
    bucket_name = get_or_create_s3_bucket(account_id, region)
    
    # 4. Package code
    zip_path = zip_project()
    s3_key = upload_zip_to_s3(s3_client, bucket_name, zip_path)
    
    # Remove temp file
    try:
        os.remove(zip_path)
    except:
        pass
        
    # 5. Check/Create Elastic Beanstalk Application
    print(f"[EB] Checking Elastic Beanstalk Application '{APPLICATION_NAME}'...")
    try:
        apps = eb_client.describe_applications(ApplicationNames=[APPLICATION_NAME])
        if not apps['Applications']:
            print(f"[EB] Creating new EB Application '{APPLICATION_NAME}'...")
            eb_client.create_application(
                ApplicationName=APPLICATION_NAME,
                Description="ApexTrade AI Stock Analyzer App"
            )
            print("[EB] Application created.")
        else:
            print(f"[EB] Application '{APPLICATION_NAME}' already exists.")
    except ClientError as e:
        print(f"[ERROR] Error checking/creating EB application: {e}")
        sys.exit(1)
        
    # 6. Create Application Version
    version_label = s3_key.replace(".zip", "")
    print(f"[EB] Creating Application Version '{version_label}'...")
    try:
        eb_client.create_application_version(
            ApplicationName=APPLICATION_NAME,
            VersionLabel=version_label,
            SourceBundle={
                'S3Bucket': bucket_name,
                'S3Key': s3_key
            },
            AutoCreateApplication=True
        )
        print("[EB] Application version registered.")
    except ClientError as e:
        print(f"[ERROR] Failed to create application version: {e}")
        sys.exit(1)
        
    # 7. Check/Deploy Environment
    solution_stack = get_latest_docker_platform(eb_client)
    print(f"[EB] Locating Environment '{ENVIRONMENT_NAME}'...")
    try:
        envs = eb_client.describe_environments(
            ApplicationName=APPLICATION_NAME,
            EnvironmentNames=[ENVIRONMENT_NAME],
            IncludeDeleted=False
        )
        
        # Define default configuration options
        option_settings = [
            {
                'Namespace': 'aws:autoscaling:launchconfiguration',
                'OptionName': 'IamInstanceProfile',
                'Value': 'aws-elasticbeanstalk-ec2-role'
            },
            {
                'Namespace': 'aws:elasticbeanstalk:environment',
                'OptionName': 'EnvironmentType',
                'Value': 'SingleInstance'  # Keeps cost minimum
            }
        ]
        
        if not envs['Environments']:
            # Environment does not exist, create it
            print(f"[EB] Initializing new environment '{ENVIRONMENT_NAME}' (Docker Stack)...")
            print("Please wait, this will take about 3-5 minutes...")
            eb_client.create_environment(
                ApplicationName=APPLICATION_NAME,
                EnvironmentName=ENVIRONMENT_NAME,
                VersionLabel=version_label,
                SolutionStackName=solution_stack,
                OptionSettings=option_settings
            )
        else:
            # Environment exists, update version
            env = envs['Environments'][0]
            if env['Status'] == 'Ready':
                print(f"[EB] Updating existing environment '{ENVIRONMENT_NAME}' to version '{version_label}'...")
                eb_client.update_environment(
                    EnvironmentName=ENVIRONMENT_NAME,
                    VersionLabel=version_label
                )
            else:
                print(f"[EB] Environment '{ENVIRONMENT_NAME}' is currently in state '{env['Status']}'. Cannot update yet.")
                print("Please wait a few minutes and run the script again.")
                sys.exit(1)
                
    except ClientError as e:
        print(f"[ERROR] Elastic Beanstalk environment operation failed: {e}")
        sys.exit(1)
        
    # 8. Monitor Status
    print("\n[EB] Monitoring environment status. Pinging live status updates...")
    while True:
        try:
            envs = eb_client.describe_environments(
                ApplicationName=APPLICATION_NAME,
                EnvironmentNames=[ENVIRONMENT_NAME]
            )
            if envs['Environments']:
                env = envs['Environments'][0]
                status = env['Status']
                health = env.get('Health', 'Unknown')
                print(f"   [Status: {status}] [Health: {health}]")
                
                if status == 'Ready':
                    print("\n=======================================================")
                    print("[SUCCESS] DEPLOYMENT SUCCESSFUL!")
                    print(f"Public URL: http://{env['CNAME']}")
                    print("=======================================================")
                    break
                elif status == 'Terminated' or health == 'Red':
                    print(f"\n[ERROR] Deployment failed! Health state: {health}")
                    break
            time.sleep(15)
        except KeyboardInterrupt:
            print("\n[WARN] Monitoring interrupted by user. The deployment is still progressing on AWS.")
            break
        except Exception as e:
            print(f"[WARN] Error monitoring environment: {e}")
            time.sleep(15)

if __name__ == "__main__":
    deploy()
