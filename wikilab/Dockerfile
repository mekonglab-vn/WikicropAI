# Sử dụng base image chuẩn của JupyterHub
FROM jupyterhub/jupyterhub:latest

# Cài đặt plugin để kết nối Keycloak (GenericOAuthenticator)
# và DockerSpawner để tạo container riêng cho từng user
RUN pip install oauthenticator dockerspawner jupyterhub-idle-culler

# Cài đặt JupyterLab và Notebook để user có cái dùng
RUN pip install jupyterlab notebook